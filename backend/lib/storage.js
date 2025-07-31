import * as Minio from "minio";
import dotenv from "dotenv";

dotenv.config();

const storage = new Minio.Client({
  endPoint: process.env.STORAGE_ENDPOINT,
  port: process.env.STORAGE_PORT,
  useSSL: process.env.NODE_ENV === "production",
  accessKey: process.env.STORAGE_ACCESS_KEY,
  secretKey: process.env.STORAGE_SECRET_KEY,
});

export const uploadFile = async (
  filePath,
  folder = "products",
  bucketName = process.env.STORAGE_BUCKET_NAME,
  objectName = `${folder}/image-${Date.now()}.jpg`
) => {
  try {
    const isProduction =
      process.env.NODE_ENV === "production" ? "https" : "http";
    await storage.fPutObject(bucketName, objectName, filePath);
    return `${isProduction}://${process.env.STORAGE_ENDPOINT}:${process.env.STORAGE_PORT}/${bucketName}/${objectName}`;
  } catch (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

export const deleteFile = async (bucketName, objectName) => {
  try {
    await storage.removeObject(bucketName, objectName);
    return {
      success: true,
      message: `Deleted ${objectName} from ${bucketName}`,
    };
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};
