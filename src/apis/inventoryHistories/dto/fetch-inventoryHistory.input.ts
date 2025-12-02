import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';

@InputType()
export class FetchInventoryHistoryInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  limit: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  storeId?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  tireId?: number;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date) // 문자열 -> Date 객체 자동 변환
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
