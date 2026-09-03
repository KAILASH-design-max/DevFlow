import fs from "fs";
import path from "path";
import crypto from "crypto";
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

  /**
   * Initializes the root uploads directory if not present
   */
  static init() {
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  /**
   * Saves a file buffer to local disk storage
   */
  static async saveFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    folder: string = "general"
  ): Promise<StoredFile> {
    this.init();

    const targetFolder = path.join(this.baseUploadDir, folder);

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Sanitize filename and create unique UUID prefix
    const ext = path.extname(originalFilename) || "";
    const baseName = path
      .basename(originalFilename, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 40);

    const uniqueId = crypto.randomUUID().slice(0, 8);
    const uniqueFilename = `${Date.now()}-${uniqueId}-${baseName}${ext}`;
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
   * The URL includes `?sig=<hmac>&exp=<timestamp>` query parameters.
   * The signature is HMAC‑SHA256 of `${fileUrl}|${expiry}` using a secret.
   */
  static generateSignedUrl(fileUrl: string, expiresInSec: number = 3600): string {
    const expiry = Math.floor(Date.now() / 1000) + expiresInSec;
    const secret = StorageService.signingSecret;
    const data = `${fileUrl}|${expiry}`;
    const sig = crypto.createHmac("sha256", secret).update(data).digest("hex");
    const separator = fileUrl.includes("?") ? "&" : "?";
    return `${fileUrl}${separator}sig=${sig}&exp=${expiry}`;
  }

  /**
   * Validate a signed URL.
   * Returns true if the signature matches and the URL has not expired.
   */
  static validateSignedUrl(fileUrl: string, sig: string, exp: string): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (parseInt(exp, 10) < now) return false;
    const secret = StorageService.signingSecret;
    const data = `${fileUrl}|${exp}`;
    const expected = crypto.createHmac("sha256", secret).update(data).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  }

  // (removed stray brace)

  /**
   * Deletes a file given its public URL or relative path
   */
  static async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // Extract /uploads/... relative path
      const match = fileUrl.match(/\/uploads\/(.+)$/);
      if (!match || !match[1]) return false;

      const relativePath = match[1];
      const absolutePath = path.join(this.baseUploadDir, relativePath);

      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Failed to delete attachment from disk:", err);
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
      const absolutePath = path.join(this.baseUploadDir, relativePath);

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
