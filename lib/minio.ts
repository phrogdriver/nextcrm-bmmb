import { S3Client } from "@aws-sdk/client-s3";

const isConfigured =
  process.env.MINIO_ENDPOINT &&
  process.env.MINIO_ACCESS_KEY &&
  process.env.MINIO_SECRET_KEY &&
  process.env.MINIO_BUCKET;

export const minioClient = isConfigured
  ? new S3Client({
      endpoint: process.env.MINIO_ENDPOINT,
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
      },
      forcePathStyle: true,
    })
  : null;

export const MINIO_BUCKET = process.env.MINIO_BUCKET ?? null;
export const MINIO_PUBLIC_URL = process.env.NEXT_PUBLIC_MINIO_ENDPOINT ?? null;
