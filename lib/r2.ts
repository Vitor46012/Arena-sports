import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

let s3Client: S3Client | null = null;

function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return s3Client;
}

export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; s3Key: string; provider: "r2" | "local" }> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME || "sports-review-media";
  const publicDomain =
    process.env.R2_PUBLIC_DOMAIN || "https://pub-sportsreview.r2.dev";

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const s3Key = `branding/${timestamp}_${safeName}`;

  if (client) {
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );

      const cleanDomain = publicDomain.endsWith("/")
        ? publicDomain.slice(0, -1)
        : publicDomain;
      const url = `${cleanDomain}/${s3Key}`;

      return { url, s3Key, provider: "r2" };
    } catch (err) {
      console.warn(
        "[R2_UPLOAD_WARNING] Falha no upload para Cloudflare R2, utilizando fallback local:",
        err
      );
    }
  }

  // Fallback: Local filesystem /public/uploads
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const localFileName = `${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, localFileName);
    fs.writeFileSync(filePath, fileBuffer);

    return {
      url: `/uploads/${localFileName}`,
      s3Key: `uploads/${localFileName}`,
      provider: "local",
    };
  } catch (fsErr) {
    console.error("[LOCAL_UPLOAD_ERROR] Falha ao salvar arquivo local:", fsErr);
    // Base64 Data URL fallback as absolute guarantee
    const base64 = fileBuffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;
    return {
      url: dataUrl,
      s3Key: `inline/${safeName}`,
      provider: "local",
    };
  }
}
