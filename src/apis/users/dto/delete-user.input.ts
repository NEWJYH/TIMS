import { InputType, Field } from '@nestjs/graphql';
import { MinLength } from 'class-validator';

@InputType()
export class DeletUserInput {
  @Field(() => String)
  @MinLength(4, { message: '비밀번호는 최소 4자리 이상이어야 합니다.' })
  currentPassword: string;
}
