import { prisma } from "@devflow/database";
import { StorageService } from "../../services/storage.service.js";
import { createError } from "../../middleware/errorHandler.js";
import { eventBus } from "../../services/eventEmitter.js";
import type { AttachmentItem } from "@devflow/shared";

export class AttachmentService {
  /**
   * Uploads and attaches a file to an issue
   */
  static async uploadAttachment(
    userId: string,
    issueId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    }
  ) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { project: true },
    });

    if (!issue) {
      throw createError("Issue not found", 404);
    }

    // Save physical file to disk
    const stored = await StorageService.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      `issues/${issueId}`
    );

    // Save database record
    const attachment = await prisma.attachment.create({
      data: {
        filename: stored.filename,
        url: stored.url,
        mimeType: stored.mimeType,
        size: stored.size,
        issueId,
        uploaderId: userId,
      },
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "ATTACHMENT_ADDED",
        entityType: "ISSUE",
        entityId: issueId,
        userId,
        metadata: JSON.stringify({
          attachmentId: attachment.id,
          filename: attachment.filename,
          size: attachment.size,
          mimeType: attachment.mimeType,
        }),
      },
    });

    // Generate markdown helper snippet
    const isImage = (attachment.mimeType || "").startsWith("image/");
    const markdownSnippet = isImage
      ? `![${attachment.filename}](${attachment.url})`
      : `[📎 ${attachment.filename}](${attachment.url})`;

    return {
      attachment: {
        id: attachment.id,
        filename: attachment.filename,
        url: attachment.url,
        mimeType: attachment.mimeType,
        size: attachment.size,
        issueId: attachment.issueId,
        uploaderId: attachment.uploaderId,
        uploader: attachment.uploader,
        createdAt: attachment.createdAt.toISOString(),
      },
      markdownSnippet,
    };
  }

  /**
   * Lists all attachments for an issue
   */
  static async getIssueAttachments(issueId: string): Promise<AttachmentItem[]> {
    const attachments = await prisma.attachment.findMany({
      where: { issueId },
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      url: a.url,
      mimeType: a.mimeType,
      size: a.size,
      issueId: a.issueId,
      uploaderId: a.uploaderId,
      uploader: a.uploader,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  /**
   * Gets single attachment details by id
   */
  static async getAttachment(attachmentId: string) {
    return await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
  }

  /**
   * Deletes an attachment and purges the file from storage
   */
  static async deleteAttachment(userId: string, attachmentId: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { issue: true },
    });

    if (!attachment) {
      throw createError("Attachment not found", 404);
    }

    // Delete physical file
    await StorageService.deleteFile(attachment.url);

    // Delete Prisma record
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "ATTACHMENT_DELETED",
        entityType: "ISSUE",
        entityId: attachment.issueId,
        userId,
        metadata: JSON.stringify({
          attachmentId,
          filename: attachment.filename,
        }),
      },
    });

    return { success: true, message: "Attachment deleted successfully" };
  }

  /**
   * Reads raw log / text file content for inline inspection
   */
  static async getLogPreview(attachmentId: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw createError("Attachment not found", 404);
    }

    const content = await StorageService.readFileContent(attachment.url);
    return {
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      content: content || "Unable to read file content.",
    };
  }
}
