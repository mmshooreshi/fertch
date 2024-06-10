import winston from 'winston';
import 'winston-daily-rotate-file';
import chalk from 'chalk';

// Define log format
const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// ASCII Art for Start and End
const asciiStart = chalk.green(`
8 8888         ,o888888o.         ,o888888o.    
8 8888      . 8888     \`88.      8888     \`88.  
8 8888     ,8 8888       \`8b  ,8 8888       \`8. 
8 8888     88 8888        \`8b 88 8888           
8 8888     88 8888         88 88 8888           
8 8888     88 8888         88 88 8888           
8 8888     88 8888        ,8P 88 8888   8888888 
8 8888     \`8 8888       ,8P  \`8 8888       .8' 
8 8888      \` 8888     ,88'      8888     ,88'  
8 888888888888 \`8888888P'         \`8888888P'    `);

const asciiEnd = chalk.red(`
^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V^V
`);
const asciiScrapeStart = chalk.bgGrey(`
███    ██   ███████   ██     ██ 
████   ██   ██        ██     ██ 
██ ██  ██   █████     ██  █  ██ 
██  ██ ██   ██        ██ ███ ██ 
██   ████   ███████    ███ ███  
`);

const transport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// Define log formats for different log types using chalk.bgHex and chalk hex colorings
const fileUploadSuccessFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#d4edda').hex('#155724')(`${timestamp} [${level}]: File upload success: ${message}`);
});

const fileUploadErrorFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#f8d7da').hex('#721c24')(`${timestamp} [${level}]: File upload error: ${message}`);
});

const fileSaveSuccessFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#d4edda').hex('#155724')(`${timestamp} [${level}]: File save success: ${message}`);
});

const fileSaveErrorFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#f8d7da').hex('#721c24')(`${timestamp} [${level}]: File save error: ${message}`);
});

const waitingFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#fff3cd').hex('#856404')(`${timestamp} [${level}]: Waiting: ${message}`);
});

const scrapedSuccessFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#d4edda').hex('#155724')(`${timestamp} [${level}]: Scraped success: ${message}`);
});

const scrapedErrorFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#f8d7da').hex('#721c24')(`${timestamp} [${level}]: Scraped error: ${message}`);
});

const alertFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#cce5ff').hex('#004085')(`${timestamp} [${level}]: Alert: ${message}`);
});

const processSuccessFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#1e7e34').hex('#ffffff').bold(`${timestamp} [${level}]: Process was successful: ${message}`);
});

const processStartFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#17a2b8').hex('#ffffff').bold(`${timestamp} [${level}]: Process started: ${message}`);
});

const processErrorFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#dc3545').hex('#ffffff').bold(`${timestamp} [${level}]: Process error: ${message}`);
});

const cacheFoundFormat = winston.format.printf(({ timestamp, level, message }) => {
  return chalk.bgHex('#1b1b1b').hex('#00ff00').bold(`${timestamp} [${level}]: Cache found: ${message}`);
});


// Custom format combining necessary winston formats and chalk styles
const customLogFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format((info) => {
    switch (info.messageType) {
      case 'fileUploadSuccess':
        return fileUploadSuccessFormat.transform(info);
      case 'fileUploadError':
        return fileUploadErrorFormat.transform(info);
      case 'fileSaveSuccess':
        return fileSaveSuccessFormat.transform(info);
      case 'fileSaveError':
        return fileSaveErrorFormat.transform(info);
      case 'waiting':
        return waitingFormat.transform(info);
      case 'scrapedSuccess':
        return scrapedSuccessFormat.transform(info);
      case 'scrapedError':
        return scrapedErrorFormat.transform(info);
      case 'alert':
        return alertFormat.transform(info);
      case 'processSuccess':
        return processSuccessFormat.transform(info);
      case 'processStart':
        return processStartFormat.transform(info);
      case 'processError':
        return processErrorFormat.transform(info);
      case 'cacheFound':
        return cacheFoundFormat.transform(info);  
      default:
        return logFormat.transform(info);
    }
  })()
);

const logger = winston.createLogger({
  level: 'info',
  format: customLogFormat,
  transports: [
    transport,
    new winston.transports.Console({
      format: customLogFormat,
    }),
  ],
});

logger.asciiStart = asciiStart;
logger.asciiEnd = asciiEnd;
logger.asciiScrapeStart = asciiScrapeStart;

export default logger;
