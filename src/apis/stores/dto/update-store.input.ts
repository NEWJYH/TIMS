import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateStoreInput } from './create-store.input';
import { IsInt, Min } from 'class-validator';

@InputType()
export class UpdateStoreInput extends PartialType(CreateStoreInput) {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  id: number;
}
