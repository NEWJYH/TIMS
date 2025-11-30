import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tire } from './entities/tire.entity';
import { TiresResolver } from './tires.resolver';
import { TiresService } from './tires.service';
import { TireBrandsModule } from '../tireBrands/tireBrands.module';
import { TireCategoriesModule } from '../tireCatetories/tireCategories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tire, //
    ]),
    TireBrandsModule,
    TireCategoriesModule,
  ],
  providers: [
    TiresResolver, //
    TiresService,
  ],
  exports: [
    TiresService, //
  ],
})
export class TiresModule {}
