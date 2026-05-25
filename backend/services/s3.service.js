import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bktName = process.env.AWS_BUCKET_NAME
const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.aws_access_key_id
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.aws_secret_access_key

const s3Client = new S3Client({
    region: awsRegion,
    credentials : {
        accessKeyId,
        secretAccessKey
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

export const getS3ObjectBuffer = async (key) => {
    const command = new GetObjectCommand({
        Bucket: bktName,
        Key: key
    })

    const response = await s3Client.send(command)
    const chunks = []

    for await (const chunk of response.Body) {
        chunks.push(chunk)
    }

    return Buffer.concat(chunks)
}

export const deleteS3File = async (key) =>{
    const command = new DeleteObjectCommand({
        Bucket: bktName,
        Key: key
    })
    return await s3Client.send(command)
}
export const deleteS3Files = async (keys) => {
    const safeKeys = Array.isArray(keys)
        ? keys.filter(item => item && typeof item.Key === 'string' && item.Key.trim().length > 0)
        : []

    if (safeKeys.length === 0) {
        return { $metadata: { httpStatusCode: 200 }, skipped: true }
    }

    const command = new DeleteObjectsCommand({
        Bucket: bktName,
        Delete : {
            Objects : safeKeys
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