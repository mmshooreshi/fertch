import fs from 'fs';
import path from 'path';
import ColorThief from 'colorthief';
import chalk from 'chalk';
import { createCanvas, loadImage } from 'canvas';
import { PNG } from 'pngjs';

const __dirname = path.resolve();

const extractColorPalette = async (imagePath, count) => {
  try {
    const result = await ColorThief.getPalette(imagePath, count);
    if (!result ) {
      throw new Error('Error extracting color palette: Palette not found');
    }
    // console.log(result)
    // const palette = result.palette;
    return result;
  } catch (error) {
    throw new Error(`Error extracting color palette: ${error.message}`);
  }
};

const generatePaletteImage = (palette, outputPath) => {
  const canvas = createCanvas(palette.length * 100, 100);
  const ctx = canvas.getContext('2d');

  palette.forEach((color, index) => {
    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    ctx.fillRect(index * 100, 0, 100, 100);
  });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
};

export const getImagePalette = async (inputImagePath, count=10) => {
  try {
    const palette = await extractColorPalette(inputImagePath, count);
    // console.log(chalk.bgBlue('Extracted Color Palette:'), palette);

    const paletteImagePath = path.join(__dirname, path.basename(inputImagePath).replace('.png','_palette.png'));
    generatePaletteImage(palette, paletteImagePath);
    console.log(chalk.bgWhiteBright(`Palette image saved at: ${paletteImagePath}`));

    return { palette, paletteImagePath };
  } catch (error) {
    console.error(chalk.bgRed('Error extracting color palette:'), error);
    throw error;
  }
};
