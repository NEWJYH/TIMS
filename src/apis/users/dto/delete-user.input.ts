import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, MinLength } from 'class-validator';

@InputType()
export class DeletUserInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @MinLength(4, { message: '비밀번호는 최소 4자리 이상이어야 합니다.' })
  currentPassword?: string;
}
