import scrapePage from '../services/puppeteerService.js';
import logger from '../logger.js';
import { get, set, del } from '../utils/persistentCache.js';

const defaultScraper = async (url, force = false, count) => {
  try {
    const cacheKey = `${url}-${count}`;
    if (!force) {
      const cachedData = await get(cacheKey);
      if (cachedData && cachedData.status !== 404) {
        logger.info(`Returning cached data for URL: ${url} with count: ${count}`, { messageType: 'cacheFound' });
        return cachedData;
      } else if (cachedData && cachedData.status === 404) {
        logger.info(`Cached data for URL: ${url} with count: ${count} is 404, retrying...`);
      }
    } else {
      logger.info(`Force re-scrape enabled for URL: ${url} with count: ${count}`);
    }
  } catch (error) {
    logger.error(`Error using cache for URL: ${url} with count: ${count}, retrying...`, { error: error.toString() });
  }

  try {
    const data = await scrapePage(url);
    const cacheKey = `${url}-${count}`;
    await set(cacheKey, data, { ttl: 60 * 60 * 1000 });
    logger.info(`Caching data for URL: ${url} with count: ${count}`);
    return data;
  } catch (error) {
    logger.error(`Error scraping URL: ${url} with count: ${count}`, { error: error.toString() });
    throw error;
  }
};

export default defaultScraper;

