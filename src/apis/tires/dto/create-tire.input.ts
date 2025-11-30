import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class CreateTireInput {
  @Field(() => Int)
  @IsInt()
  @Min(1) // ID는 1 이상이어야 함
  brandId: number;

  @Field(() => String)
  @IsNotEmpty()
  name: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  categoryId: number;

  @Field(() => Int)
  @IsInt()
  width: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  aspectRatio?: number;

  @Field(() => Int)
  @IsInt()
  diameter: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  plyRating?: string;
}
