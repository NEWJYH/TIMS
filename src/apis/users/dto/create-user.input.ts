import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다.' })
  email: string;

  @Field(() => String)
  @MinLength(4, { message: '비밀번호는 최소 4자리 이상이어야 합니다.' })
  password: string;

  @Field(() => String)
  @IsNotEmpty()
  name: string;

  @Field(() => String)
  @Matches(/^010-\d{3,4}-\d{4}$/, {
    message: '휴대전화 형식(010-0000-0000)을 지켜주세요.',
  })
  phoneNumber: string;
}
