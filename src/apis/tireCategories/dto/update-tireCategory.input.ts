import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { CreateTireCategoryInput } from './create-tireCategory.input';
import { IsInt, Min } from 'class-validator';

@InputType()
export class UpdateTireCategoryInput extends PartialType(
  CreateTireCategoryInput,
) {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  id: number;
}
