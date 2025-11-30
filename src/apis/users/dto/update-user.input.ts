import { InputType, PartialType, OmitType, Field } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';
import { MinLength } from 'class-validator';

@InputType()
export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['email'] as const),
) {
  @Field(() => String)
  @MinLength(4, { message: '비밀번호는 최소 4자리 이상이어야 합니다.' })
  currentPassword: string;
}
