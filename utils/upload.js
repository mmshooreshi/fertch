import Client from 'ssh2-sftp-client';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import PQueue from 'p-queue';
import mime from 'mime-types';
import logger from '../logger.js'
import process from 'process'

const sftp = new Client();
const queue = new PQueue({ concurrency: 1 }); // Ensure only one upload at a time

const connectSftp = async () => {
  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT,
      username: process.env.SFTP_USERNAME,
      privateKey: process.env.SFTP_PRIVATE_KEY_PATH,
      passphrase: process.env.SFTP_PASSPHRASE
    });
  } catch (error) {
    console.error(chalk.bgRed('Error connecting to server:'), error);
    throw error;
  }
};


const uploadFile = async (localPath, remoteDir) => {
  const remoteFileName = path.basename(localPath);
  const remotePath = path.join(remoteDir, remoteFileName);
  const serverURL = `https://anywrite.app/files/${remoteFileName}`;

  let attempts = 3;

  while (attempts > 0) {
    try {
      await connectSftp();
      const mimeType = mime.lookup(localPath) || 'application/octet-stream';
      await sftp.put(localPath, remotePath, { encoding: 'binary', mimeType });
      // console.log(chalk.bgCyanBright(`File uploaded to: ${serverURL}`));
      logger.log({  level: 'info',  message: `File upload uploaded to: ${serverURL}`,  messageType: 'fileUploadSuccess'});

      return serverURL;
    } catch (err) {
      console.error(chalk.bgRed('Error uploading file to server:'), err);
      attempts -= 1;
      if (attempts === 0) {
        throw err;
      }
      console.log(chalk.bgYellow(`Retrying... attempts left: ${attempts}`));
    } finally {
      sftp.end();
    }
  }
};


export const uploadToServer = async (localPath, remoteDir) => {
  return queue.add(() => uploadFile(localPath, remoteDir));
};
