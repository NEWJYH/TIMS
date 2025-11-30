import { registerEnumType } from '@nestjs/graphql';

export enum RoleRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(RoleRequestStatus, {
  name: 'RoleRequestStatus',
});
