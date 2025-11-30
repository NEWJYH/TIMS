import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateRoleInput } from './create-role.input';
import { IsInt, Min } from 'class-validator';

@InputType()
export class UpdateRoleInput extends PartialType(CreateRoleInput) {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  id: number;
}
