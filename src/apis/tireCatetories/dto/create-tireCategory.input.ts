import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class CreateTireCategoryInput {
  @Field(() => String)
  @IsNotEmpty()
  name: string;
}
