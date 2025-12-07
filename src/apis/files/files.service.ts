import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Upload } from '@aws-sdk/lib-storage';
import { getToDay } from 'src/commons/libraries/utils';
import { Stream } from 'stream';
import {
  IFileServiceFindAll,
  IFileServiceUpload,
} from './interfaces/files-service.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { File } from './entities/file.entity';

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly s3Client: S3Client;
  private readonly bucketName = process.env.S3_BUCKET as string;

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {
    this.s3Client = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY as string,
        secretAccessKey: process.env.S3_SECRET_KEY as string,
      },
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
    });
  }

  // 서버 켜질 때 딱 한 번만 실행
  async onModuleInit() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
    } catch (error: any) {
      console.log(error);
      console.log(`버킷(${this.bucketName})이 없어서 생성합니다...`);
      try {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        console.log(`버킷 생성 완료!`);
      } catch (createError) {
        console.error('버킷 생성 실패:', createError);
      }
    }
  }

  async upload({ user, file }: IFileServiceUpload): Promise<string> {
    const { filename, mimetype } = file;

    // 날짜 폴더 링
    const uniqueFileName = `${getToDay()}/${uuidv4()}_${filename}`;
    const parallelUploads3 = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: uniqueFileName,
        Body: file.createReadStream(),
        ContentType: mimetype,
        // ACL: 'public-read',
        ACL: 'private',
        // ContentDisposition: 'inline', // 브라우저에서 바로 보기 설정
      },
    });
    await parallelUploads3.done();

    const apiDomain = 'http://localhost:3000';
    const publicUrl = `${apiDomain}/files/${uniqueFileName}`;

    try {
      const newFile = this.fileRepository.create({
        url: publicUrl,
        path: uniqueFileName,
        name: filename,
        mimeType: mimetype,
        user: user,
      });

      await this.fileRepository.save(newFile);

      return publicUrl; // 성공 시 리턴
    } catch (error) {
      console.error('DB 저장 실패. S3 파일 롤백 중...', error);

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: uniqueFileName,
        }),
      );

      throw error; // 에러를 다시 던져서 클라이언트에게 알림
    }
    // return `${apiDomain}/${this.bucketName}/${uniqueFileName}`;
    // return publicUrl;
  }

  async downloadFile(
    fileName: string,
  ): Promise<{ stream: Stream; contentType: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
    });

    const response = await this.s3Client.send(command);

    return {
      stream: response.Body as Stream,
      contentType: response.ContentType || 'application/octet-stream',
    };
  }

  async findOne(id: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!file) throw new NotFoundException('파일 정보를 찾을 수 없습니다.');
    return file;
  }

  async findAll({ user, fetchFileInput }: IFileServiceFindAll) {
    const { page, limit } = fetchFileInput;

    const where: FindOptionsWhere<File> = {};

    if (user.role.name !== 'ADMIN') {
      where.userId = user.id;
    }

    return await this.fileRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
  }
}
