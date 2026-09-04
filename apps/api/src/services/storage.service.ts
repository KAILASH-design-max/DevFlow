import fs from "fs";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config/index.js";
import { createError } from "../middleware/errorHandler.js";

export interface StoredFile {
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
}

export class StorageService {
  // Persistent secret for URL signing (generated once per process if not provided)
  private static signingSecret: string = config.urlSigningSecret || crypto.randomBytes(32).toString("hex");
  private static baseUploadDir = path.resolve(process.cwd(), config.uploadDir);
  private static s3Client?: S3Client;

  /**
   * Lazy S3 Client with forcePathStyle support for S3/Neon/MinIO buckets
   */
  static getS3Client(): S3Client {
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        forcePathStyle: true,
        region: process.env.AWS_REGION || "us-east-2",
        endpoint: process.env.S3_ENDPOINT || process.env.NEON_STORAGE_ENDPOINT || undefined,
        credentials: (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        } : undefined,
      });
    }
    return this.s3Client;
  }

  /**
   * Initializes the root uploads directory if local storage driver is used
   */
  static init() {
    if (config.storageDriver !== "s3") {
      if (!fs.existsSync(this.baseUploadDir)) {
        fs.mkdirSync(this.baseUploadDir, { recursive: true });
      }
    }
  }

  /**
   * Saves a file buffer to disk or S3 bucket
   */
  static async saveFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    folder: string = "general"
  ): Promise<StoredFile> {
    const ext = path.extname(originalFilename) || "";
    const baseName = path
      .basename(originalFilename, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 40);

    const uniqueId = crypto.randomUUID().slice(0, 8);
    const uniqueFilename = `${Date.now()}-${uniqueId}-${baseName}${ext}`;

    if (config.storageDriver === "s3") {
      const bucket = process.env.S3_BUCKET || "assets";
      const key = `${folder}/${uniqueFilename}`;
      const s3 = this.getS3Client();

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
        })
      );

      const presignedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: 86400 }
      );

      return {
        filename: originalFilename,
        originalName: originalFilename,
        url: presignedUrl,
        mimeType,
        size: fileBuffer.length,
      };
    }

    this.init();

    const targetFolder = path.join(this.baseUploadDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const filePath = path.join(targetFolder, uniqueFilename);
    await fs.promises.writeFile(filePath, fileBuffer);

    // Relative web URL
    const relativePath = `/uploads/${folder}/${uniqueFilename}`.replace(/\\/g, "/");
    const fullUrl = `${config.apiBaseUrl}${relativePath}`;

    return {
      filename: originalFilename,
      originalName: originalFilename,
      url: fullUrl,
      mimeType,
      size: fileBuffer.length,
    };
  }

  /**
   * Generate a signed temporary URL for a stored file.
   * If S3 is used and already presigned, returns fileUrl directly.
   */
  static generateSignedUrl(fileUrl: string, expiresInSec: number = 3600): string {
    if (fileUrl.startsWith("http") && fileUrl.includes("X-Amz-Signature")) {
      return fileUrl;
    }
    const expiry = Math.floor(Date.now() / 1000) + expiresInSec;
    const secret = StorageService.signingSecret;
    const data = `${fileUrl}|${expiry}`;
    const sig = crypto.createHmac("sha256", secret).update(data).digest("hex");
    const separator = fileUrl.includes("?") ? "&" : "?";
    return `${fileUrl}${separator}sig=${sig}&exp=${expiry}`;
  }

  /**
   * Validate a signed URL.
   */
  static validateSignedUrl(fileUrl: string, sig: string, exp: string): boolean {
    if (fileUrl.startsWith("http") && fileUrl.includes("X-Amz-Signature")) {
      return true;
    }
    const now = Math.floor(Date.now() / 1000);
    if (parseInt(exp, 10) < now) return false;
    const secret = StorageService.signingSecret;
    const data = `${fileUrl}|${exp}`;
    const expected = crypto.createHmac("sha256", secret).update(data).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  }

  /**
   * Resolves and verifies that a relative path stays strictly within baseUploadDir
   */
  private static resolveSafePath(relativePath: string): string | null {
    const normalized = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "");
    const absolutePath = path.resolve(this.baseUploadDir, normalized);
    if (!absolutePath.startsWith(this.baseUploadDir)) {
      return null;
    }
    return absolutePath;
  }

  /**
   * Deletes a file given its public URL or relative path
   */
  static async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (config.storageDriver === "s3") {
        const bucket = process.env.S3_BUCKET || "assets";
        const keyMatch = fileUrl.match(/(?:uploads\/|\.com\/|\.net\/)([^?]+)/);
        if (keyMatch && keyMatch[1]) {
          const s3 = this.getS3Client();
          await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: keyMatch[1] }));
          return true;
        }
      }

      // Extract /uploads/... relative path
      const match = fileUrl.match(/\/uploads\/(.+)$/);
      if (!match || !match[1]) return false;

      const relativePath = match[1];
      const absolutePath = this.resolveSafePath(relativePath);
      if (!absolutePath) return false;

      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Failed to delete attachment:", err);
      return false;
    }
  }

  /**
   * Reads a text / log file content for inline log viewing
   */
  static async readFileContent(fileUrl: string, maxBytes: number = 100000): Promise<string | null> {
    try {
      const match = fileUrl.match(/\/uploads\/(.+)$/);
      if (!match || !match[1]) return null;

      const relativePath = match[1];
      const absolutePath = this.resolveSafePath(relativePath);
      if (!absolutePath) return null;

      if (!fs.existsSync(absolutePath)) return null;

      const fileHandle = await fs.promises.open(absolutePath, "r");
      const buffer = Buffer.alloc(maxBytes);
      const { bytesRead } = await fileHandle.read(buffer, 0, maxBytes, 0);
      await fileHandle.close();

      return buffer.toString("utf-8", 0, bytesRead);
    } catch (err) {
      console.warn("Failed to read log content from disk:", err);
      return null;
    }
  }
}
