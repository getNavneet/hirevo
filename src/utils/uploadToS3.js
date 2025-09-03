import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";
import mime from "mime-types";

// AWS S3 Client setup
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (localFilePath, folderName) => {
  try {
    if (!localFilePath || !folderName) {
      throw new Error("File path and folder name are required.");
    }

    const fileName = path.basename(localFilePath); // e.g., resume.pdf
    const fileExtension = path.extname(fileName);  // e.g., .pdf
    const mimeType = mime.lookup(fileExtension) || "application/octet-stream";

    const uniqueFileName = `${Date.now()}_${fileName}`;
    const s3Key = `${folderName}/${uniqueFileName}`;

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: fs.createReadStream(localFilePath),
      ContentType: mimeType,
    };

    const upload = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    const result = await upload.done();

    console.log("✅ File uploaded to S3:", result.Location);

    // Optionally delete the local file
    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.warn("⚠️ Failed to delete local file:", err.message);
      } else {
        console.log("🧹 Local file deleted.");
      }
    });

    return result.Location;
  } catch (error) {
    console.error("❌ S3 Upload Error:", error.message);
    return null;
  }
};




export { uploadToS3 };
