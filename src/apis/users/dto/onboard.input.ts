import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

@InputType()
export class OnboardInput {
  @Field(() => String)
  @IsNotEmpty()
  name: string;

  @Field(() => String)
  @IsString()
  position: string;

  @Field(() => Boolean)
  @IsBoolean()
  isCEO: boolean;

  @Field(() => String, { nullable: true })
  @ValidateIf((o: OnboardInput) => o.isCEO === true)
  @IsNotEmpty({ message: '사장님은 매장명을 입력해야 합니다.' })
  @IsString()
  storeName?: string;

  @Field(() => String, { nullable: true })
  @ValidateIf((o: OnboardInput) => o.isCEO === true)
  @IsNotEmpty({ message: '사장님은 주소를 입력해야 합니다.' })
  @IsString()
  storeAddress?: string;

  @Field(() => String, { nullable: true })
  @ValidateIf((o: OnboardInput) => o.isCEO === true)
  @IsOptional()
  @IsString()
  businessLicenseUrl?: string;

  @Field(() => Int, { nullable: true })
  @ValidateIf((o: OnboardInput) => o.isCEO === false)
  @IsNotEmpty({ message: '직원은 소속될 매장을 선택해야 합니다.' })
  storeId?: number;
}
