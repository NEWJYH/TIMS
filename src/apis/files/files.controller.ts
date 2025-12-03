import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { Response } from 'express';
import { RolesGuard } from 'src/commons/guards/roles.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { RoleName } from 'src/commons/enums/role.enum';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Get('*filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const key = decodeURIComponent(filename.replaceAll(',', '/'));

      const { stream, contentType } = await this.filesService.downloadFile(key);

      res.setHeader('Content-Type', contentType);
      stream.pipe(res);
    } catch (error) {
      console.error('File Download Error:', error);
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }
  }
}
