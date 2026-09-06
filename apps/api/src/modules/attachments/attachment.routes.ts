import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middleware/auth.js";
import { createError } from "../../middleware/errorHandler.js";
import { AttachmentService } from "./attachment.service.js";
import { StorageService } from "../../services/storage.service.js";
import { config } from "../../config/index.js";
import {
  verifyIssueAccess,
  verifyAttachmentAccess,
} from "../../middleware/authorizationHelpers.js";

export const attachmentRouter = Router();

// Whitelist of allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "text/plain",
  "text/x-log",
  "text/csv",
  "text/markdown",
  "application/json",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
]);

// Explicitly blocked dangerous executable file extensions
const BLOCKED_EXTENSIONS = new Set([
  "exe", "dll", "so", "dylib", "bin", "bat", "cmd", "sh", "bash", "ps1", "vbs",
  "js", "mjs", "cjs", "jsx", "ts", "tsx", "php", "phtml", "jsp", "asp", "aspx",
  "cgi", "pl", "py", "html", "htm", "shtml", "hta", "msi", "scr", "jar", "wsf"
]);

/**
 * Lightweight multipart/form-data buffer parser for resilient zero-config uploads
 * Hardened with real-time stream byte counting to prevent memory exhaustion DoS
 */
function parseMultipartBuffer(req: Request): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      return reject(createError("Content-Type must be multipart/form-data", 400));
    }

    const maxAllowedUploadBytes = (config.maxFileSizeMb * 1024 * 1024) + (64 * 1024);
    let totalBytes = 0;
    const chunks: Buffer[] = [];
    let aborted = false;

    req.on("data", (chunk) => {
      if (aborted) return;
      totalBytes += chunk.length;
      if (totalBytes > maxAllowedUploadBytes) {
        aborted = true;
        req.destroy();
        return reject(createError(`File size exceeds maximum allowed limit of ${config.maxFileSizeMb}MB`, 413));
      }
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on("end", () => {
      if (aborted) return;
      const fullBuffer = Buffer.concat(chunks);
      const boundaryMatch = contentType.match(/boundary=(?:["']?([^"';]+)["']?)/);
      if (!boundaryMatch) {
        return reject(createError("Invalid multipart boundary", 400));
      }

      const boundary = boundaryMatch[1];
      const boundaryDelimiter = Buffer.from(`--${boundary}`);
      const bodyString = fullBuffer.toString("binary");

      // Locate Content-Disposition header
      const dispMatch = bodyString.match(/Content-Disposition:\s*form-data;\s*name="[^"]+";\s*filename="([^"]+)"/i);
      const typeMatch = bodyString.match(/Content-Type:\s*([^\r\n]+)/i);

      if (!dispMatch) {
        return reject(createError("No file found in multipart upload", 400));
      }

      const rawFilename = dispMatch[1];
      const mimetype = typeMatch ? typeMatch[1].trim() : "application/octet-stream";

      // Find the start of binary content (after \r\n\r\n)
      const headerEndIndex = fullBuffer.indexOf(Buffer.from("\r\n\r\n"));
      if (headerEndIndex === -1) {
        return reject(createError("Malformed multipart body", 400));
      }

      const dataStartIndex = headerEndIndex + 4;

      // Find next boundary delimiter
      const nextBoundaryIndex = fullBuffer.indexOf(boundaryDelimiter, dataStartIndex);
      const dataEndIndex = nextBoundaryIndex !== -1 ? nextBoundaryIndex - 2 : fullBuffer.length;

      const fileBuffer = fullBuffer.subarray(dataStartIndex, dataEndIndex);

      resolve({
        buffer: fileBuffer,
        filename: decodeURIComponent(rawFilename),
        mimetype,
      });
    });

    req.on("error", (err) => {
      if (!aborted) reject(err);
    });
  });
}

// All attachment routes require authentication
attachmentRouter.use(authenticate);

/**
 * POST /api/attachments/issues/:issueId
 * Upload a file attachment to an issue
 */
attachmentRouter.post(
  "/issues/:issueId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { issueId } = req.params;
      const userId = req.user!.userId;

      // SECURITY: Verify caller has access to the target issue & project
      await verifyIssueAccess(userId, issueId as string);

      // Parse uploaded file
      const parsedFile = await parseMultipartBuffer(req);

      // Validate file size (10MB default)
      const maxBytes = config.maxFileSizeMb * 1024 * 1024;
      if (parsedFile.buffer.length > maxBytes) {
        throw createError(`File size exceeds maximum allowed limit of ${config.maxFileSizeMb}MB`, 400);
      }

      // Sanitize and check filename
      const rawFilename = parsedFile.filename.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 100);
      const ext = rawFilename.split(".").pop()?.toLowerCase() || "";
      if (BLOCKED_EXTENSIONS.has(ext)) {
        throw createError(`File extension .${ext} is forbidden for security reasons`, 400);
      }

      // Validate MIME type against whitelist
      if (!ALLOWED_MIME_TYPES.has(parsedFile.mimetype.toLowerCase())) {
        const allowedExts = ["png","jpg","jpeg","gif","webp","svg","txt","log","json","csv","pdf","zip"];
        if (!ext || !allowedExts.includes(ext)) {
          throw createError(
            `Unsupported file type (${parsedFile.mimetype}). Allowed types: images, logs, text, JSON, CSV, PDF, ZIP.`,
            400
          );
        }
      }

      const result = await AttachmentService.uploadAttachment(userId, issueId as string, {
        buffer: parsedFile.buffer,
        originalname: rawFilename,
        mimetype: parsedFile.mimetype,
        size: parsedFile.buffer.length,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/attachments/issues/:issueId
 * List all attachments for an issue
 */
attachmentRouter.get(
  "/issues/:issueId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { issueId } = req.params;
      // SECURITY: Verify caller has access to the target issue & project
      await verifyIssueAccess(req.user!.userId, issueId as string);

      const attachments = await AttachmentService.getIssueAttachments(issueId as string);
      res.json({ success: true, data: attachments });
    } catch (error) {
      next(error);
    }
  }
);

// -------------------------------------------------------------------
// Signed URL generation for a specific attachment
// -------------------------------------------------------------------
attachmentRouter.get(
  "/:attachmentId/signed-url",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { attachmentId } = req.params;
      // SECURITY: Verify caller has access to the attachment's issue & project
      await verifyAttachmentAccess(req.user!.userId, attachmentId as string);

      const expiresIn = parseInt(req.query.expiresIn as string) || 3600;
      const attachment = await AttachmentService.getAttachment(attachmentId as string);
      if (!attachment) throw createError("Attachment not found", 404);

      const signedUrl = StorageService.generateSignedUrl(attachment.url, expiresIn);
      res.json({ success: true, data: { signedUrl } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/attachments/:attachmentId/preview
 * Read raw log / text content for inline preview
 */
attachmentRouter.get(
  "/:attachmentId/preview",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { attachmentId } = req.params;
      // SECURITY: Verify caller has access to the attachment's issue & project
      await verifyAttachmentAccess(req.user!.userId, attachmentId as string);

      const preview = await AttachmentService.getLogPreview(attachmentId as string);
      res.json({ success: true, data: preview });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/attachments/:attachmentId
 * Delete an attachment
 */
attachmentRouter.delete(
  "/:attachmentId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { attachmentId } = req.params;
      const userId = req.user!.userId;

      // SECURITY: Verify caller has access to the attachment's issue & project
      await verifyAttachmentAccess(userId, attachmentId as string);

      const result = await AttachmentService.deleteAttachment(userId, attachmentId as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);
