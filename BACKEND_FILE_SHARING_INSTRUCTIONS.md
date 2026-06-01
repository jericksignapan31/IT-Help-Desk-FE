# Backend File/Image Sharing Implementation Guide

## Overview
The Angular frontend is ready to send file attachments with chat messages. This guide explains what the backend needs to implement to fully support file uploading and sharing in the chat system.

---

## 1. Data Model Extensions

### Update Message Entity
Add support for file attachments to the existing Message entity in your NestJS backend.

```typescript
// src/chat/entities/message.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../../../users/entities/user.entity';
import { FileAttachment } from './file-attachment.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversation_id: string;

  @Column('uuid')
  sender_id: string;

  @Column('text')
  content: string;

  @Column('boolean', { default: false })
  is_read: boolean;

  // NEW: Add relation to file attachments
  @OneToMany(() => FileAttachment, (attachment) => attachment.message, {
    eager: true,
    cascade: ['insert', 'remove'],
  })
  attachments: FileAttachment[];

  @ManyToOne(() => Conversation, (conv) => conv.messages, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @ManyToOne(() => User)
  sender: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### Create FileAttachment Entity
Create a new entity to store file metadata.

```typescript
// src/chat/entities/file-attachment.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity('file_attachments')
export class FileAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  message_id: string;

  @Column('varchar', { length: 255 })
  filename: string;

  @Column('varchar', { length: 100 })
  file_type: string; // MIME type (e.g., 'image/jpeg')

  @Column('bigint')
  file_size: number; // in bytes

  @Column('varchar', { length: 500 })
  file_url: string; // URL or path to uploaded file

  @Column('varchar', { length: 500, nullable: true })
  preview_url: string; // Thumbnail/preview URL for images

  @ManyToOne(() => Message, (message) => message.attachments, { onDelete: 'CASCADE' })
  message: Message;

  @CreateDateColumn()
  uploaded_at: Date;
}
```

### Create DTOs for File Attachments

```typescript
// src/chat/dto/file-attachment.dto.ts

export class FileAttachmentDto {
  id?: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  preview_url?: string;
  uploaded_at?: string;
}

// src/chat/dto/create-message.dto.ts (UPDATE)

import { IsString, IsUUID, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { FileAttachmentDto } from './file-attachment.dto';

export class CreateMessageDto {
  @IsUUID()
  conversation_id: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAttachmentDto)
  attachments?: FileAttachmentDto[];
}
```

---

## 2. File Storage Configuration

### Option A: Local File Storage

```typescript
// src/config/file-upload.config.ts

import * as path from 'path';

export const fileUploadConfig = {
  // Directory where files will be stored
  uploadDir: path.join(process.cwd(), 'uploads', 'chat'),
  
  // Max file size: 10MB
  maxFileSize: 10 * 1024 * 1024,
  
  // Allowed MIME types
  allowedMimeTypes: [
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
  ],
  
  // Allowed file extensions
  allowedExtensions: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf',
    '.doc', '.docx',
    '.xls', '.xlsx',
    '.txt',
    '.zip',
  ],
};
```

### Option B: Cloud Storage (AWS S3 / Azure Blob)

For production, consider cloud storage:

```typescript
// .env
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# OR Azure Blob Storage
AZURE_STORAGE_ACCOUNT=your-account
AZURE_STORAGE_KEY=your-key
AZURE_CONTAINER_NAME=chat-files
```

---

## 3. File Upload Service

Create a service to handle file operations.

```typescript
// src/chat/services/file-upload.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileUploadConfig } from '../config/file-upload.config';
import { FileAttachmentDto } from '../dto/file-attachment.dto';

@Injectable()
export class FileUploadService {
  async saveUploadedFile(
    file: Express.Multer.File,
    conversationId: string,
  ): Promise<FileAttachmentDto> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${conversationId}_${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
    
    // Create upload directory if it doesn't exist
    const uploadDir = fileUploadConfig.uploadDir;
    await fs.mkdir(uploadDir, { recursive: true });

    // Save file
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    // Generate file URL (adjust based on your setup)
    const fileUrl = `/api/chat/files/${fileName}`;

    // Create attachment DTO
    const attachment: FileAttachmentDto = {
      filename: file.originalname,
      file_type: file.mimetype,
      file_size: file.size,
      file_url: fileUrl,
    };

    // Generate preview for images
    if (this.isImageFile(file.mimetype)) {
      attachment.preview_url = fileUrl; // Or generate thumbnail
    }

    return attachment;
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(fileUploadConfig.uploadDir, fileName);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > fileUploadConfig.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds ${fileUploadConfig.maxFileSize / 1024 / 1024}MB limit`,
      );
    }

    // Check file type
    if (!fileUploadConfig.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }

    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!fileUploadConfig.allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File extension ${fileExtension} is not allowed`,
      );
    }
  }

  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  async getFile(fileName: string): Promise<Buffer> {
    const filePath = path.join(fileUploadConfig.uploadDir, fileName);
    return await fs.readFile(filePath);
  }
}
```

---

## 4. Controller Updates

Update the chat controller to handle file uploads.

```typescript
// src/chat/controllers/chat.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from '../services/chat.service';
import { FileUploadService } from '../services/file-upload.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../../users/entities/user.entity';

@Controller('api/chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private fileUploadService: FileUploadService,
  ) {}

  // Existing endpoints...

  /**
   * Create message with optional file attachments
   * POST /api/chat/messages
   * 
   * Body: CreateMessageDto
   * {
   *   conversation_id: string,
   *   content: string,
   *   attachments?: FileAttachmentDto[]
   * }
   */
  @Post('messages')
  async createMessage(
    @CurrentUser() user: User,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.chatService.createMessage(user.id, createMessageDto);
  }

  /**
   * Upload files for a message
   * POST /api/chat/messages/:conversationId/upload
   * 
   * Content-Type: multipart/form-data
   * Form fields:
   *   - files: File[] (multiple files)
   * 
   * Returns: FileAttachmentDto[]
   */
  @Post('messages/:conversationId/upload')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files per request
  async uploadFiles(
    @Param('conversationId') conversationId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: User,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Validate user has access to this conversation
    await this.chatService.validateUserInConversation(user.id, conversationId);

    // Save all files
    const attachments = await Promise.all(
      files.map((file) => this.fileUploadService.saveUploadedFile(file, conversationId)),
    );

    return { attachments };
  }

  /**
   * Get file by name
   * GET /api/chat/files/:fileName
   * 
   * Returns: File content (image, PDF, etc.)
   */
  @Get('files/:fileName')
  async getFile(@Param('fileName') fileName: string, @Res() res: any) {
    const file = await this.fileUploadService.getFile(fileName);
    
    // Determine MIME type
    const ext = fileName.split('.').pop();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      txt: 'text/plain',
      zip: 'application/zip',
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.send(file);
  }

  /**
   * Delete file attachment
   * DELETE /api/chat/attachments/:attachmentId
   */
  @Delete('attachments/:attachmentId')
  async deleteAttachment(
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: User,
  ) {
    return this.chatService.deleteAttachment(attachmentId, user.id);
  }
}
```

---

## 5. Service Updates

Update the ChatService to handle attachments.

```typescript
// src/chat/services/chat.service.ts

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { FileAttachment } from '../entities/file-attachment.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { ChatGateway } from '../gateways/chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(FileAttachment)
    private attachmentRepository: Repository<FileAttachment>,
    private chatGateway: ChatGateway,
  ) {}

  async createMessage(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    // Create message
    const message = this.messageRepository.create({
      conversation_id: createMessageDto.conversation_id,
      sender_id: senderId,
      content: createMessageDto.content,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Save attachments if provided
    if (createMessageDto.attachments && createMessageDto.attachments.length > 0) {
      const attachments = await Promise.all(
        createMessageDto.attachments.map((attachment) =>
          this.attachmentRepository.save({
            message_id: savedMessage.id,
            filename: attachment.filename,
            file_type: attachment.file_type,
            file_size: attachment.file_size,
            file_url: attachment.file_url,
            preview_url: attachment.preview_url,
          }),
        ),
      );

      savedMessage.attachments = attachments;
    }

    // Fetch full message with relations
    const fullMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'attachments'],
    });

    // Broadcast via Socket.io
    this.chatGateway.broadcastNewMessage(
      createMessageDto.conversation_id,
      fullMessage,
    );

    return fullMessage;
  }

  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
      relations: ['message'],
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Verify user is the message sender
    if (attachment.message.sender_id !== userId) {
      throw new ForbiddenException('You can only delete your own attachments');
    }

    // Delete file from storage
    const fileName = attachment.file_url.split('/').pop();
    await this.fileUploadService.deleteFile(fileName);

    // Delete from database
    await this.attachmentRepository.remove(attachment);
  }

  async validateUserInConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    // Verify user is part of the conversation
    // Implementation depends on your Conversation structure
  }
}
```

---

## 6. Socket.io Gateway Updates

Update the Socket.io gateway to broadcast attachments with messages.

```typescript
// src/chat/gateways/chat.gateway.ts

import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Message } from '../entities/message.entity';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Existing handlers...

  /**
   * Broadcast new message to conversation participants
   * Includes attachments in the message object
   */
  broadcastNewMessage(conversationId: string, message: Message): void {
    this.server.to(conversationId).emit('new_message', {
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      sender: message.sender,
      content: message.content,
      is_read: message.is_read,
      attachments: message.attachments, // ← Include attachments
      created_at: message.created_at,
      updated_at: message.updated_at,
    });
  }

  /**
   * Handle message with file upload
   * Socket event: 'send_message_with_files'
   */
  @SubscribeMessage('send_message_with_files')
  async handleMessageWithFiles(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: string; messageData: any },
  ) {
    try {
      const message = await this.chatService.createMessage(
        socket.handshake.auth.user_id,
        data.messageData,
      );
      this.broadcastNewMessage(data.conversationId, message);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }
}
```

---

## 7. Module Configuration

Update ChatModule to include new services and entities.

```typescript
// src/chat/chat.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { FileAttachment } from './entities/file-attachment.entity';
import { Conversation } from './entities/conversation.entity';
import { ChatService } from './services/chat.service';
import { FileUploadService } from './services/file-upload.service';
import { ChatController } from './controllers/chat.controller';
import { ChatGateway } from './gateways/chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, FileAttachment, Conversation]),
  ],
  providers: [ChatService, FileUploadService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService, FileUploadService],
})
export class ChatModule {}
```

---

## 8. Multer Configuration (Optional - for file upload middleware)

```typescript
// src/config/multer.config.ts

import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';

export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'chat');
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}_${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};
```

---

## 9. Database Migration

Create a TypeORM migration to add file_attachments table.

```bash
npx typeorm migration:create src/database/migrations/CreateFileAttachmentsTable
```

```typescript
// src/database/migrations/XXX_CreateFileAttachmentsTable.ts

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateFileAttachmentsTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'file_attachments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'message_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'file_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'file_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'preview_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'uploaded_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'file_attachments',
      new TableForeignKey({
        columnNames: ['message_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'messages',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('file_attachments');
  }
}
```

---

## 10. API Endpoints Summary

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/api/chat/messages` | Create message with attachments | `{ conversation_id, content, attachments }` |
| POST | `/api/chat/messages/:conversationId/upload` | Upload files | `multipart/form-data: files` |
| GET | `/api/chat/files/:fileName` | Download file | - |
| DELETE | `/api/chat/attachments/:attachmentId` | Delete attachment | - |

---

## 11. Testing the Implementation

### 1. Test File Upload
```bash
curl -X POST http://localhost:3000/api/chat/messages/conv-id/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@image.jpg" \
  -F "files=@document.pdf"
```

### 2. Test Message with Attachments
```bash
curl -X POST http://localhost:3000/api/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "conv-id",
    "content": "Check out these files!",
    "attachments": [
      {
        "filename": "image.jpg",
        "file_type": "image/jpeg",
        "file_size": 12345,
        "file_url": "/api/chat/files/image_abc123.jpg",
        "preview_url": "/api/chat/files/image_abc123.jpg"
      }
    ]
  }'
```

---

## 12. Security Considerations

- ✅ **Validate file types** - Only allow specific MIME types
- ✅ **Validate file sizes** - Enforce 10MB limit
- ✅ **Scan for viruses** - Consider antivirus scanning for production
- ✅ **Validate file extensions** - Prevent executable uploads
- ✅ **User authorization** - Verify user is in conversation before upload
- ✅ **Rate limiting** - Implement rate limiting on upload endpoint
- ✅ **Sanitize filenames** - Remove special characters from filenames
- ✅ **Store securely** - Use proper file permissions (600 or less)

---

## 13. Performance Optimization

- Use **image compression** before storage (ImageMagick, Sharp)
- Generate **thumbnails** for image previews
- Implement **CDN** for file delivery (CloudFront, Cloudflare)
- Cache file metadata in **Redis**
- Cleanup old files automatically with a **cron job**

---

## Frontend Integration Ready ✅

The Angular frontend is already configured to:
- Select and validate files locally
- Generate image previews
- Send files with messages
- Display attachments in chat
- Remove files before sending

**Once the backend endpoints are ready, everything will work seamlessly!**

---

## Quick Implementation Checklist

- [ ] Create `FileAttachment` entity
- [ ] Update `Message` entity with attachments relation
- [ ] Create DTOs for file attachments
- [ ] Implement `FileUploadService`
- [ ] Update `ChatService` to handle attachments
- [ ] Update `ChatController` with upload endpoints
- [ ] Update `ChatGateway` to broadcast attachments
- [ ] Configure Multer for file uploads
- [ ] Create database migration
- [ ] Update ChatModule imports
- [ ] Test file upload endpoint
- [ ] Test message with attachments endpoint
- [ ] Test file download endpoint
- [ ] Verify Socket.io broadcasts attachments
- [ ] Deploy and test end-to-end
