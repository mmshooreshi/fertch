import puppeteer from 'puppeteer-extra';
import { Cluster } from 'puppeteer-cluster';
import puppeteerExtraStealth from 'puppeteer-extra-plugin-stealth';
import puppeteerExtraAnonymizeUA from 'puppeteer-extra-plugin-anonymize-ua';
import puppeteerExtraRecaptcha from 'puppeteer-extra-plugin-recaptcha';
import puppeteerExtraUserPreferences from 'puppeteer-extra-plugin-user-preferences';
import puppeteerExtraAdblocker from 'puppeteer-extra-plugin-adblocker';
import ora from 'ora';
import chalk from 'chalk';
import ansiEscapes from 'ansi-escapes';
import os from 'os';
import path from 'path';
import logger from '../logger.js';
import { saveHtmlFile, ensureDirectoryExists } from '../utils/fileUtils.js';
import { uploadToImgur } from '../utils/imgurUtils.js';
import { uploadToServer } from '../utils/upload.js';
import {formatTimestamp} from '../utils/time.js'
const __dirname = path.dirname(new URL(import.meta.url).pathname);

puppeteer.use(puppeteerExtraStealth());
puppeteer.use(puppeteerExtraAnonymizeUA());
puppeteer.use(puppeteerExtraRecaptcha());
puppeteer.use(puppeteerExtraUserPreferences({
  userPrefs: {
    webkit: {
      webprefs: {
        default_font_size: 16
      }
    }
  }
}));
puppeteer.use(puppeteerExtraAdblocker());

const ignoredResources = ['image', 'stylesheet', 'font'];
const ignoreFlag = false

export const configureCluster = async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    puppeteer,
    puppeteerOptions: {
      ignoreHTTPSErrors: true,
      args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
      timeout: 80000 // 80 seconds
    }
  });

  cluster.on('taskerror', (err, data) => {
    logger.error(`Error crawling ${data}: ${err.message}`);
  });

  return cluster;
};

const scrapePage = async (url) => {
  const cluster = await configureCluster();

  const screenshotPath = await new Promise((resolve, reject) => {
    cluster.task(async ({ page, data: url }) => {
      const requestSpinner = ora({ text: chalk.gray(`Requesting ${url} ??`), spinner: 'dots' }).start();

      await page.setRequestInterception(true);

      page.on('request', request => {
        const resourceType = request.resourceType();
        console.log(ansiEscapes.cursorTo(0) + chalk.gray(`Request: ${request.method()} ${request.url()} ??`));
        if (ignoredResources.includes(resourceType) && ignoreFlag) {
          console.log(ansiEscapes.cursorTo(0) + chalk.bgYellow(`Ignored ${resourceType} request: ${request.url()}`));
          request.abort();
        } else {
          request.continue();
        }
      });

      page.on('response', response => {
        const status = response.status();
        const url = response.url();
        const method = response.request().method();
        if (status >= 200 && status < 300) {
          console.log(ansiEscapes.cursorTo(0) + chalk.bgBlue(`Response: ${status} ${method} ${url}`));
        } else {
          console.log(ansiEscapes.cursorTo(0) + chalk.bgRed(`Response: ${status} ${method} ${url}`));
        }
      });

      page.on('pageerror', error => {
        console.log(ansiEscapes.cursorTo(0) + chalk.bgRed(`Page error: ${error.message}`));
      });

      page.on('console', msg => {
        logger.info(chalk.bgYellow(`Console log: ${msg.text()}`));
      });

      page.on('domcontentloaded', async () => {
        logger.info(chalk.bgCyan('DOM content loaded'));
        const html = await page.content();
        saveHtmlFile(url, 'domcontentloaded', html);
        logger.info(chalk.bgMagenta(`Saved HTML for DOMContentLoaded`));
      });

      page.on('load', async () => {
        logger.info(chalk.bgGreenBright('Page fully loaded'));
        const html = await page.content();
        saveHtmlFile(url, 'load', html);
        logger.info(chalk.bgMagenta(`Saved HTML for Page Load`));
      });

      logger.info(chalk.bgBlue(`Navigating to URL: ${url}`));
      await page.goto(url, { waitUntil: 'networkidle2' });

      logger.info(chalk.bgYellow('Page loaded, starting evaluation'));

      const html = await page.content();
      const data = await page.evaluate(() => {
        return {
          title: document.title,
          text: document.body.innerText,
          links: Array.from(document.links).map(link => link.href),
          images: Array.from(document.images).map(img => img.src),
          forms: Array.from(document.forms).map(form => {
            const formData = new FormData(form);
            const formValues = {};
            for (const [key, value] of formData.entries()) {
              formValues[key] = value;
            }
            return formValues;
          }),
          scripts: Array.from(document.scripts).map(script => script.src),
          iframes: Array.from(document.querySelectorAll('iframe')).map(iframe => iframe.src),
          tables: Array.from(document.querySelectorAll('table')).map(table => {
            const rows = Array.from(table.rows).map(row => Array.from(row.cells).map(cell => cell.innerText));
            return rows;
          }),
          headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(heading => heading.innerText)
        };
      });

      saveHtmlFile(url, 'evaluation', html);
      logger.info(chalk.bgMagenta(`Saved HTML for Evaluation`));

      logger.info(
        chalk.bgBlueBright('Scraping ') +
        chalk.bgGreenBright('Completed ') +
        chalk.bgGreen(';) ') +
        chalk.bgBlueBright('--> ') +
        chalk.bgBlue(`${url} \n`) +
        "\n" +
        // chalk.bgMagentaBright(JSON.stringify(data, null, 2)) +
        "\n"
      );

      // Scrolling screenshot
      logger.info(chalk.bgCyan('Starting scrolling screenshot'));

      try {
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              window.scrollBy(0, distance);
              totalHeight += distance;
              if (totalHeight >= document.body.scrollHeight) {
                clearInterval(timer);
                resolve();
              }
            }, 100);
          });
        });

        
        // logger.info(formatTimestamp(1));
        // logger.info(formatTimestamp(2));
        const hostname = new URL(url).hostname
        const sanitizedUrl = encodeURIComponent(hostname).replace(/[^a-zA-Z0-9-_]/g, '_');
        const timestampFormatted = encodeURIComponent(formatTimestamp()) // new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = path.join(os.tmpdir(), `${timestampFormatted}_${sanitizedUrl}_screenshot.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        logger.info(chalk.bgGreenBright(`Saved scrolling screenshot: ${screenshotPath}`));

        const serverURL = await uploadToServer(screenshotPath, '/var/www/anywrite.app/html/files/');
        resolve(screenshotPath)
        // resolve(serverURL);
      } catch (error) {
        logger.error(chalk.bgRed(`Failed to save scrolling screenshot: ${error.message}`));
        reject(error);
      }

      //   const screenshotPath = path.join(os.tmpdir(), `${formatTimestamp(1)}⸺${new URL(url).hostname}.png`);
      //   await page.screenshot({ path: screenshotPath, fullPage: true });
      //   logger.info(chalk.bgGreenBright(`Saved scrolling screenshot: ${screenshotPath}`));

      //   // const imgurLink = await uploadToImgur(screenshotPath);
      //   const serverURL = await uploadToServer(screenshotPath, '/var/www/anywrite.app/html/files');
      //   resolve(serverURL);
      //   resolve(screenshotPath);
      // } catch (error) {
      //   logger.error(chalk.bgRed(`Failed to save scrolling screenshot: ${error.message}`));
      //   reject(error);
      // }

      return data;
    });

    cluster.queue(url);
    logger.info(chalk.bgYellow('URL queued for scraping'));
    cluster.idle().then(() => {
      logger.info(chalk.bgGreen('Cluster idling'));
      cluster.close().then(() => {
        logger.info(chalk.bgRed('Cluster closed'));
      });
    });
  });

  return screenshotPath;
};



export default scrapePage;


