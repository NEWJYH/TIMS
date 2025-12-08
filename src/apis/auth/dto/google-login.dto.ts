import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class GoogleLoginInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  token: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  device: string; // ios, android 기기정보

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  issuedIp: string; // ip 정보
}
