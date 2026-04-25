import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bktName = process.env.AWS_BUCKET_NAME
const s3Client = new S3Client({
    credentials : {
        accessKeyId: process.env.aws_access_key_id,
        secretAccessKey: process.env.aws_secret_access_key
    },
    requestStreamBufferSize: 64 * 1024,
})

export const makeSignedUrl = async ({ key, filetype, method, name, download = false }) => {
    let command;
    if (method === 'put') {
        command = new PutObjectCommand({
            Bucket: bktName,
            Key: key,
            ContentType: filetype,
            StorageClass: 'INTELLIGENT_TIERING'
        })
    } else if (method === 'get') {
        command = new GetObjectCommand({
            Bucket: bktName,
            Key: key,
            ResponseContentDisposition: `${download ? 'attachment' : 'inline'}; filename="${decodeURIComponent(name)}"`
        })
    }

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 })
}

export const getFileMetadata = async (key) => {
    const command = new HeadObjectCommand({
        Bucket: bktName,
        Key: key
    })
    const metadata = await s3Client.send(command)
    return metadata
}

export const deleteS3File = async (key) =>{
    const command = new DeleteObjectCommand({
        Bucket: bktName,
        Key: key
    })
    return await s3Client.send(command)
}
export const deleteS3Files = async (keys) => {
    const command = new DeleteObjectsCommand({
        Bucket: bktName,
        Delete : {
            Objects : keys
        }
    })

    return await s3Client.send(command)
}
export const uploadToS3 = async ({ key, body, contentType = 'application/octet-stream', contentLength }) => {
    const commandInput = {
        Bucket: bktName,
        Key: key,
        Body: body,
        ContentType: contentType,
        StorageClass: 'INTELLIGENT_TIERING'
    }

    if (Number.isFinite(contentLength) && contentLength >= 0) {
        commandInput.ContentLength = contentLength
    }

    const command = new PutObjectCommand(commandInput)

    return await s3Client.send(command)
}