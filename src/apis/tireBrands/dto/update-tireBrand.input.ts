import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateTireBrandInput } from './create-tireBrand.input';
import { IsInt, Min } from 'class-validator';

@InputType()
export class UpdateTireBrandInput extends PartialType(CreateTireBrandInput) {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  id: number;
}
