import { User } from 'src/apis/users/entities/user.entity';
import { CreateStoreInput } from '../dto/create-store.input';
import { UpdateStoreInput } from '../dto/update-store.input';

export interface IStoreServiceCreate {
  createStoreInput: CreateStoreInput;
}

export interface IStoreServiceUpdate {
  user: User;
  updateStoreInput: UpdateStoreInput;
}

export interface IStoreServiceCheckCode {
  code: string;
}
