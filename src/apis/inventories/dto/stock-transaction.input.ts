import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class StockInInput {
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  storeId?: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  tireId: number;

  @Field(() => Int)
  @IsInt()
  quantity: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  memo?: string;
}

@InputType()
export class StockOutInput extends StockInInput {}

@InputType()
export class StockAdjustInput extends StockInInput {}
