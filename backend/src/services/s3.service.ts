import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler';

function getS3Client(): AWS.S3 {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'ap-south-2';

  if (!accessKeyId || !secretAccessKey) {
    throw new AppError('AWS S3 credentials are not configured on the server', 500);
  }

  return new AWS.S3({
    accessKeyId,
    secretAccessKey,
    region,
  });
}

/**
 * Uploads a multipart image file buffer to AWS S3 and returns the public object URL.
 */
export async function uploadImageToS3(
  file: Express.Multer.File,
  folder = 'dishes'
): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new AppError('AWS_S3_BUCKET is not configured', 500);
  }

  const s3 = getS3Client();

  // Extract extension and generate unique UUID key
  const originalName = file.originalname || 'image.jpg';
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const key = `${folder}/${uuidv4()}.${ext}`;

  const params: AWS.S3.PutObjectRequest = {
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype || 'image/jpeg',
  };

  const uploadResult = await s3.upload(params).promise();
  return uploadResult.Location;
}
