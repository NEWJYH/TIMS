import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TireCategory } from './entities/tireCategory.entity';
import { TireCategoriesResolver } from './tireCategories.resolver';
import { TireCategoriesService } from './tireCategories.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TireCategory, //
    ]),
  ],
  providers: [
    TireCategoriesResolver, //
    TireCategoriesService,
  ],
  exports: [
    TireCategoriesService, //
  ],
})
export class TireCategoriesModule {}
