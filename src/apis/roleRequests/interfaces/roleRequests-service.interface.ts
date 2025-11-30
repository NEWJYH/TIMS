import { CreateRoleRequestInput } from '../dto/create-roleRequest.input';
import { ProcessRoleRequestInput } from '../dto/process-roleRequest.input';

// 요청 생성 (User ID + Input)
export interface IRoleRequestsServiceCreate {
  userId: string;
  createRoleRequestInput: CreateRoleRequestInput;
}

// 요청 처리 (Admin ID + Input)
export interface IRoleRequestsServiceProcess {
  adminId: string;
  processRoleRequestInput: ProcessRoleRequestInput;
}
