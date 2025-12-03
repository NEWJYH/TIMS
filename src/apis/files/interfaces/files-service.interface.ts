import { FileUpload } from 'graphql-upload-ts';
import { User } from 'src/apis/users/entities/user.entity';
import { FetchFileInput } from '../dto/fetch-file.input';

export interface IFileServiceUpload {
  user: User;
  file: FileUpload;
}

export interface IFileServiceFindAll {
  user: User;
  fetchFileInput: FetchFileInput;
}
