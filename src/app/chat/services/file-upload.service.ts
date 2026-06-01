import { Injectable } from '@angular/core';
import { FileAttachment } from '../models';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
  ];

  private readonly IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      };
    }

    // Check file type
    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    return { valid: true };
  }

  isImageFile(file: File): boolean {
    return this.IMAGE_TYPES.includes(file.type);
  }

  createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isImageFile(file)) {
        reject(new Error('Not an image file'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  convertToFileAttachment(file: File): FileAttachment {
    return {
      filename: file.name,
      file_type: file.type,
      file_size: file.size,
    };
  }

  async createFileAttachmentWithPreview(
    file: File
  ): Promise<FileAttachment> {
    const attachment = this.convertToFileAttachment(file);

    // Add preview URL if it's an image
    if (this.isImageFile(file)) {
      try {
        attachment.preview_url = await this.createPreviewUrl(file);
      } catch (error) {
        console.warn('Failed to create preview for', file.name);
      }
    }

    return attachment;
  }

  getFileIcon(mimeType: string): string {
    if (this.IMAGE_TYPES.includes(mimeType)) {
      return 'image';
    }

    if (mimeType === 'application/pdf') {
      return 'picture_as_pdf';
    }

    if (
      mimeType === 'application/msword' ||
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return 'description';
    }

    if (
      mimeType === 'application/vnd.ms-excel' ||
      mimeType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return 'table_chart';
    }

    if (mimeType === 'text/plain') {
      return 'article';
    }

    if (mimeType === 'application/zip') {
      return 'folder_zip';
    }

    return 'attach_file';
  }

  getFileDisplayName(filename: string): string {
    return filename.length > 30 ? filename.substring(0, 27) + '...' : filename;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }
}
