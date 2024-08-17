import { logger } from './logger'

const sharp = require('sharp')

/* eslint-disable max-len */
const fs = require('fs')
const FfmpegCommand = require('fluent-ffmpeg')
const gm = require('gm')
export default async function optimizeMedia(
  inputPath: string,
  options?: { outPath?: string; maxSize?: number; keep?: boolean }
): Promise<string> {
  const fileAndExtension = options?.outPath ? [options.outPath, ''] : inputPath.split('.')
  const originalExtension = fileAndExtension[1].toLowerCase()
  fileAndExtension[1] = 'avif'
  let outputPath = fileAndExtension.join('.')
  const doNotDelete = options?.keep ? options.keep : false
  switch (originalExtension) {
    case 'pdf':
      break
    case 'mp4':
      fileAndExtension[0] = fileAndExtension[0] + '_processed'
    case 'webm':
    case 'ogg':
    case 'aac':
    case 'mp3':
    case 'wav':
    case 'oga':
    case 'm4a':
    case 'mov':
    case 'mkv':
    case 'av1':
      fileAndExtension[1] = 'mp4'
      outputPath = fileAndExtension.join('.')
      // eslint-disable-next-line no-unused-vars
      new FfmpegCommand(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .save(outputPath)
        .on('end', () => {
          try {
            fs.unlinkSync(inputPath, () => {
              logger.trace('media converted')
            })
          } catch (exc) {
            logger.warn(exc)
          }
        })
      break
    default:
      const metadata = await sharp(inputPath).metadata()
      if (metadata.delay) {
        fileAndExtension[1] = 'webp'
        outputPath = fileAndExtension.join('.')
      }

      let conversion = await sharp(inputPath, { animated: true }).rotate()
      //.toFile(outputPath)
      if (options?.maxSize) {
        await conversion.resize(options.maxSize, options.maxSize)
      }
      await conversion.toFile(outputPath)
      if (!doNotDelete) {
        fs.unlinkSync(inputPath)
      }
  }
  return outputPath
}
