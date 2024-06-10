import fs from 'fs';
import path from 'path';
import logger from '../logger.js';
import chalk from 'chalk';

export const saveHtmlFile = (url, event, html) => {
  const fileName = `${encodeURIComponent(url)}-${event}-${new Date().toISOString()}.html`;
  const filePath = path.resolve('html', fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html);
  logger.info(`HTML saved for event '${event}' at URL: ${url}`, { filePath });
  console.log(chalk.bgGreen.bold(`
===============================
HTML saved for event ` + chalk.yellowBright(`'${event}'`) + ` at URL: ${url}
File path: ${filePath}
===============================
`));
};

export const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
