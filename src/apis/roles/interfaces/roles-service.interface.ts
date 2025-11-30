import { CreateRoleInput } from '../dto/create-role.input';
import { UpdateRoleInput } from '../dto/update-role.input';

export interface IRoleServiceCreate {
  createRoleInput: CreateRoleInput;
}

export interface IRoleServiceUpdate {
  updateRoleInput: UpdateRoleInput;
}

export interface IRoleServiceFindByName {
  name: string;
}
