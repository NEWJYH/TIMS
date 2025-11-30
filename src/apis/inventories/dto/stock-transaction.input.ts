import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class StockInInput {
  @Field(() => Int)
  @IsInt()
  storeId: number;

  @Field(() => Int)
  @IsInt()
  tireId: number;

  @Field(() => Int)
  @IsInt()
  quantity: number;

  @Field(() => String)
  @IsString()
  userId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  memo?: string;
}

@InputType()
export class StockOutInput extends StockInInput {}

@InputType()
export class StockAdjustInput extends StockInInput {}
