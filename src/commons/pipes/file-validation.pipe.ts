import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { FileUpload } from 'graphql-upload-ts';
import * as path from 'path';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    // 'image/gif',
    // 'application/pdf',
  ];

  async transform(value: Promise<FileUpload> | FileUpload) {
    const file = await value;

    const { filename, mimetype } = file;

    // MIME Type 검사
    if (!this.allowedMimeTypes.includes(mimetype)) {
      throw new BadRequestException(
        `지원하지 않는 파일 형식입니다. (${mimetype})`,
      );
    }

    // 확장자 검사
    const ext = path.extname(filename).toLowerCase();
    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      // '.gif',
      // '.pdf',
    ];

    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(`지원하지 않는 확장자입니다. (${ext})`);
    }

    // 검증 통과한 'file' 객체를 반환
    return file;
  }
}
