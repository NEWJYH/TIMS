import { InputType, PartialType, OmitType, Field } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';
import { IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['email'] as const),
) {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  position?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(4, { message: '비밀번호는 최소 4자리 이상이어야 합니다.' })
  currentPassword?: string;
}
