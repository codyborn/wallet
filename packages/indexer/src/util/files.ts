import * as admin from 'firebase-admin'
import { Readable } from 'stream'
import Throttle from 'throttle'

export async function uploadFile(bucketName: string, destination: string, content: any) {
  const file = admin.storage().bucket(bucketName).file(destination)
  console.log('PRE - uploading file ' + destination, process.memoryUsage())
  const dataStream = new Readable()
  dataStream.push(JSON.stringify(content))
  dataStream.push(null)
  console.log('POST - uploading file ' + destination, process.memoryUsage())

  const throttle = new Throttle(100 * 1024)

  await new Promise((resolve, reject) => {
    dataStream
      .pipe(throttle)
      .pipe(
        file.createWriteStream({
          metadata: {
            contentType: 'text/json',
          },
        })
      )
      .on('error', (error: Error) => {
        reject(error)
      })
      .on('finish', () => {
        resolve(true)
      })
  })
}

export async function readFile(bucketName: string, path: string) {
  const file = admin.storage().bucket(bucketName).file(path)
  const content = await file.download()
  return JSON.parse(content.toString())
}
