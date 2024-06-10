import NodeCache from 'node-cache';
import logger from '../logger.js';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache items will expire after 1 hour

const set = (key, value) => {
  const success = cache.set(key, value);
  if (success) {
    logger.info(`Cache set for key: ${key}`);
  } else {
    logger.error(`Failed to set cache for key: ${key}`);
  }
};

const get = (key) => {
  const value = cache.get(key);
  if (value) {
    logger.info(`Cache hit for key: ${key}`);
  } else {
    logger.info(`Cache miss for key: ${key}`);
  }
  return value;
};

const clear = () => {
  cache.flushAll();
  logger.info('Cache cleared');
};

export default { set, get, clear };
