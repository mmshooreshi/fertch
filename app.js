import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import { URL } from 'url';
import dns from 'dns';
import util from 'util';
import swaggerUi from 'swagger-ui-express';
import defaultScraper from './scrapers/defaultScraper.js';
import logger from './logger.js';
import swaggerOptions from './utils/swaggerConfig.js';
import { getImagePalette } from './utils/color.js'; // Import the color utility
// import { extractColorPalette } from './utils/color.js'; // Import the color utility
import { uploadToServer } from './utils/upload.js';
import chalk, { colors } from 'chalk'
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());

// Promisify dns.lookup
const lookup = util.promisify(dns.lookup);

const isValidDomain = async (domain) => {
  try {
    await lookup(domain);
    return true;
  } catch (error) {
    return false;
  }
};


logger.log({ level: 'info', message: 'This is a file upload success message', messageType: 'fileUploadSuccess' });
logger.log({ level: 'error', message: 'This is a file upload error message', messageType: 'fileUploadError' });
logger.log({ level: 'info', message: 'This is a file save success message', messageType: 'fileSaveSuccess' });
logger.log({ level: 'error', message: 'This is a file save error message', messageType: 'fileSaveError' });
logger.log({ level: 'info', message: 'This is a waiting message', messageType: 'waiting' });
logger.log({ level: 'info', message: 'This is a scraped success message', messageType: 'scrapedSuccess' });
logger.log({ level: 'error', message: 'This is a scraped error message', messageType: 'scrapedError' });
logger.log({ level: 'warn', message: 'This is an alert message', messageType: 'alert' });



const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /scrape:
 *   get:
 *     summary: Scrape a webpage
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: URL of the page to scrape
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Download palette image
 *     responses:
 *       200:
 *         description: Scraped data
 *       400:
 *         description: Invalid input
 */
app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  const download = req.query.download

  if (!url) {
    logger.warn('URL is required', { messageType: 'alert' });
    return res.status(400).send('URL is required');
  }

  let domain;
  try {
    domain = new URL(url).hostname;
  } catch (error) {
    logger.warn('Invalid URL format', { messageType: 'alert' });
    return res.status(400).send('Invalid URL format');
  }

  const domainValid = await isValidDomain(domain);
  if (!domainValid) {
    logger.warn('Invalid domain', { messageType: 'alert' });
    return res.status(400).send('Invalid domain');
  }


  logger.info(logger.asciiScrapeStart);
  logger.info(`Scraping started for URL: ${url}`);

  try {
    const screenshotPath = await defaultScraper(url);


    if (!download) {
      res.json({ screenshotPath });
    } else {
      res.download(screenshotPath, `${new URL(url).hostname}_screenshot.png`, (err) => {
        if (err) {
          logger.error(`Error sending file for URL: ${url}`, { messageType: 'processError', error: err.toString() });
          res.status(500).send(err.toString());
        }
      });
    }

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).send(error.toString());
    }
  }
});

/**
 * @swagger
 * /color:
 *   get:
 *     summary: Extract color palette from a webpage screenshot
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: URL of the page to scrape and analyze colors
 *       - in: query
 *         name: count
 *         schema:
 *           type: number
 *         required: false
 *         description: count of colors in palette
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Download palette image
 *     responses:
 *       200:
 *         description: Extracted color palette and palette image path
 *       400:
 *         description: Invalid input
 */


const getImageColors = async (imagePath, count) => {
  try {
    const result = await getImagePalette(imagePath, count);
    return result
  } catch (error) {
    logger.error(`Error extracting colors for image: ${imagePath}`, { error: error.toString() });
    throw error;

  }
};




app.get('/color', async (req, res) => {
  const url = req.query.url;
  const count = parseInt(req.query.count, 10) || 3;  // Ensure count is an integer, default to 3 if not provided
  const download = req.query.download;
  const force = req.query.force === 'true';
  if (!url) {
    logger.warn('URL is required', { messageType: 'alert' });
    return res.status(400).send('URL is required');
  }

  let domain;
  try {
    domain = new URL(url).hostname;
  } catch (error) {
    logger.warn('Invalid URL format', { messageType: 'alert' });
    return res.status(400).send('Invalid URL format');
  }

  const domainValid = await isValidDomain(domain);
  if (!domainValid) {
    logger.warn('Invalid domain', { messageType: 'alert' });
    return res.status(400).send('Invalid domain');
  }

  logger.info(`Color extraction started for URL: ${url}`, { messageType: 'processStart' });

  try {
    const screenshotPath = await defaultScraper(url, force, count);
    logger.info(`ScreenShot path: ${screenshotPath}`, { messageType: 'fileSaveSuccess' });

    const { palette, paletteImagePath } = await getImageColors(screenshotPath, count);

    // Convert palette to hex colors
    const paletteHex = palette.map(([r, g, b]) => `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`);

    const uploadedPath = await uploadToServer(paletteImagePath, '/var/www/anywrite.app/html/files/');
    logger.info(`Color extraction completed for URL: ${url}`, { messageType: 'processSuccess' });

    if (!download) {
      res.json({ palette: paletteHex, paletteImagePath: uploadedPath });
    } else {
      res.download(paletteImagePath, 'palette.png', (err) => {
        if (err) {
          logger.error(`Error sending file for URL: ${url}`, { messageType: 'processError', error: err.toString() });
          res.status(500).send(err.toString());
        }
      });
    }
  } catch (error) {
    logger.error(`Error extracting colors for URL: ${url}`, { messageType: 'processError', error: error.toString() });
    if (!res.headersSent) {
      res.status(500).send(error.toString());
    }
  }
});



app.listen(port, () => {
  logger.info(logger.asciiStart);
  logger.info(`Server is running at http://localhost:${port}`);
  logger.info(`Swagger docs available at http://localhost:${port}/api-docs`);
  logger.info(logger.asciiEnd);
});

export default app;
