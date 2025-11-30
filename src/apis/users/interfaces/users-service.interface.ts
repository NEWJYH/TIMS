import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';

export interface IUserServiceCreate {
  createUserInput: CreateUserInput;
}

export interface IUserServiceUpdate {
  userId: string;
  updateUserInput: UpdateUserInput;
}

export interface IUserServiceFindByEmail {
  email: string;
}

export interface IUserServiceDeleteAccount {
  userId: string;
  currentPassword: string;
}
