import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TireBrand } from './entities/tireBrand.entity';
import { TireBrandsResolver } from './tireBrands.resolver';
import { TireBrandsService } from './tireBrands.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TireBrand, //
    ]),
  ],
  providers: [
    TireBrandsResolver, //
    TireBrandsService,
  ],
  exports: [
    TireBrandsService, //
  ],
})
export class TireBrandsModule {}
