import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateStoreInput {
  @Field(() => String)
  @IsNotEmpty()
  name: string;

  @Field(() => String)
  @IsNotEmpty()
  address: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsNotEmpty()
  telePhoneNumber?: string;

  @Field(() => String)
  @IsNotEmpty()
  code: string;
}
