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
