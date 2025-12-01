import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

@InputType()
export class CreateRoleRequestInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  storeId: number;
}
