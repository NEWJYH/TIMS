import { User } from 'src/apis/users/entities/user.entity';
import { CreateRoleRequestInput } from '../dto/create-roleRequest.input';
import { ProcessRoleRequestInput } from '../dto/process-roleRequest.input';
import { RoleRequestStatus } from 'src/commons/enums/roleRequestStatus.enum';

// 요청 생성 (User ID + Input)
export interface IRoleRequestsServiceCreate {
  userId: string;
  createRoleRequestInput: CreateRoleRequestInput;
}

// 요청 처리 (Admin ID + Input)
export interface IRoleRequestsServiceProcess {
  approverId: string;
  processRoleRequestInput: ProcessRoleRequestInput;
}

export interface IRoleRequestsServiceFindAll {
  user: User;
  status?: RoleRequestStatus;
}
