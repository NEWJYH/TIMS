import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FilesService } from './files.service';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { FileValidationPipe } from 'src/commons/pipes/file-validation.pipe';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { RoleName } from 'src/commons/enums/role.enum';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from 'src/commons/guards/roles.guard';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { FetchFileInput } from './dto/fetch-file.input';
import { File } from './entities/file.entity';
@Resolver()
export class FilesResolver {
  constructor(private readonly filesService: FilesService) {}

  // =================================================================
  // [Query] 조회 영역
  // =================================================================

  @Roles(RoleName.USER, RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'))
  @Query(() => [File])
  fetchMyFiles(
    @CurrentUser() currentUser: User,
    @Args('fetchFilesInput') fetchFileInput: FetchFileInput,
  ): Promise<File[]> {
    return this.filesService.findAll({ user: currentUser, fetchFileInput });
  }

  // =================================================================
  // [Mutation] 생성/수정/삭제 영역
  // =================================================================

  @Roles(RoleName.USER, RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => String)
  uploadFile(
    @CurrentUser() currentUser: User,
    @Args({ name: 'file', type: () => GraphQLUpload }, FileValidationPipe)
    file: FileUpload,
  ) {
    return this.filesService.upload({ user: currentUser, file });
  }
}
