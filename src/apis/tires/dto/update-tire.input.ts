import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateTireInput } from './create-tire.input';
import { IsInt, Min } from 'class-validator';

@InputType()
export class UpdateTireInput extends PartialType(CreateTireInput) {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  id: number;
}
