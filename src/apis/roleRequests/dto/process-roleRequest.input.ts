import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, Min } from 'class-validator';
import { RoleRequestStatus } from 'src/commons/enums/roleRequestStatus.enum';

@InputType()
export class ProcessRoleRequestInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  requestId: number;

  @Field(() => RoleRequestStatus)
  @IsEnum(RoleRequestStatus)
  status: RoleRequestStatus;
}
