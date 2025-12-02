import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateStoreInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '매장명은 필수입니다.' })
  name: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '주소는 필수입니다.' })
  address: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  businessLicenseUrl?: string;
}
