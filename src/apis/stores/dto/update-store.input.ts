import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateStoreInput } from './create-store.input';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class UpdateStoreInput extends PartialType(CreateStoreInput) {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  id: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  telePhoneNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  code?: string;
}
