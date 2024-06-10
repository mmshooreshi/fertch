import scrapePage from '../services/puppeteerService.js';
import logger from '../logger.js';
import { get, set, del } from '../utils/persistentCache.js';

const defaultScraper = async (url) => {
  try {
    const cachedData = await get(url);
    if (cachedData && cachedData.status !== 404) {
      logger.info(`Returning cached data for URL: ${url}`);
      return cachedData;
    } else if (cachedData && cachedData.status === 404) {
      logger.info(`Cached data for URL: ${url} is 404, retrying...`);
    }
  } catch (error) {
    logger.error(`Error using cache for URL: ${url}, retrying...`, { error: error.toString() });
  }

  try {
    const data = await scrapePage(url);
    await set(url, data, { ttl: 60 * 60 * 1000 });
    logger.info(`Caching data for URL: ${url}`);
    return data;
  } catch (error) {
    logger.error(`Error scraping URL: ${url}`, { error: error.toString() });
    throw error;
  }
};

export default defaultScraper;
