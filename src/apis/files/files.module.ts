import { Module } from '@nestjs/common';
import { FilesResolver } from './files.resolver';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]), //
  ],
  controllers: [
    FilesController, //
  ],
  providers: [
    FilesResolver, // 리졸버 등록
    FilesService, // 서비스 등록
  ],
})
export class FilesModule {}
