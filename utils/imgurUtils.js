import imgur from 'imgur';
import logger from '../logger.js';
import chalk from 'chalk';

export const uploadToImgur = async (filePath) => {
  try {
    const response = await imgur.uploadFile(filePath);
    return response.link;
  } catch (error) {
    logger.error(chalk.bgRed(`Failed to upload image to Imgur: ${error.message}`));
    throw error;
  }
};
