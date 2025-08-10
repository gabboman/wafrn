import { logger } from './logger.js'

import sharp from 'sharp'

/* eslint-disable max-len */
import fs from 'fs'
import FfmpegCommand from 'fluent-ffmpeg'

export default async function optimizeMedia(
  inputPath: string,
  options?: {
    outPath?: string
    maxSize?: number
    keep?: boolean
    forceImageExtension?: string
    disableAnimation?: boolean
  }
): Promise<string> {
  const fileAndExtension = options?.outPath ? [options.outPath, ''] : inputPath.split('.')
  const originalExtension = fileAndExtension[1].toLowerCase()
  fileAndExtension[1] = options?.forceImageExtension ? options.forceImageExtension : 'webp'
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
      const videoPromise = await new Promise((resolve: any, reject: any) => {
        FfmpegCommand(inputPath).ffprobe(function (err: any, data: any) {
          if (data) {
            {
              const stream = data.streams.find((stream: any) => stream.coded_height)
              let horizontalResolution = stream ? stream.coded_width : 1280
              let verticalResolution = stream ? stream.coded_height : 1280
              horizontalResolution = Math.min(horizontalResolution, 1280)
              verticalResolution = Math.min(verticalResolution, 1280)
              const resolutionString =
                horizontalResolution > verticalResolution ? `${horizontalResolution}x?` : `?x${verticalResolution}`
              const videoCodec = stream.codec_name == 'h264' ? 'copy' : 'libx264'
              const command = FfmpegCommand(inputPath)
              if (videoCodec != 'copy') {
                command.size(resolutionString)
                command.videoBitrate('3500')
              }
              command
                .audioCodec('aac')
                .videoCodec(videoCodec)
                .renice(20)
                .save(outputPath)
                .on('end', () => {
                  try {
                    fs.unlinkSync(inputPath)
                    logger.trace('media converted')
                    resolve()
                  } catch (exc) {
                    logger.warn(exc)
                    reject(exc)
                  }
                })
            }
          } else {
            logger.warn({
              message: `Error on optimizemedia`,
              error: err
            })
          }
        })
      })

      break
    default:
      const metadata = await sharp(inputPath).metadata()
      if (!options?.outPath) {
        fileAndExtension[0] = fileAndExtension[0] + '_processed'
        outputPath = fileAndExtension.join('.')
      }
      if (metadata.delay && !(options?.forceImageExtension && options.forceImageExtension == 'png')) {
        fileAndExtension[1] = 'webp'
        outputPath = fileAndExtension.join('.')
      }

      let conversion = sharp(inputPath, { animated: !options?.disableAnimation, failOnError: false }).rotate()
      if (options?.maxSize) {
        const imageMetadata = await conversion.metadata()
        if (
          imageMetadata.height &&
          imageMetadata.width &&
          (imageMetadata.height > options.maxSize || imageMetadata.width > options.maxSize)
        ) {
          let height = imageMetadata.delay ? imageMetadata.height / imageMetadata.delay.length : imageMetadata.height
          let width = imageMetadata.width
          const maxSize = options.maxSize
          if (height > width) {
            height = Math.round((maxSize * width) / height)
            width = maxSize
          } else {
            width = Math.round((maxSize * height) / width)
            height = maxSize
          }

          conversion.resize(height, width)
        }
      }
      if (fileAndExtension[1] == 'webp') {
        let stat = await fs.promises.stat(inputPath)
        let lossless = false
        // if the input is PNG we probably want the output to be lossless too
        // also allow GIFs under 2MB to be kept as lossless
        // (smaller GIFs are likely to be something like pixel art
        // where we want to keep fine detail)
        const lower = inputPath.toLowerCase()
        if (lower.endsWith('png') || (lower.endsWith('gif') && stat.size <= 1024 ** 2 * 2)) {
          lossless = true
        }
        conversion.webp({
          lossless: lossless
        })
      }
      await conversion.toFile(outputPath)
      if (!doNotDelete) {
        fs.unlinkSync(inputPath)
      }
  }
  return outputPath
}
