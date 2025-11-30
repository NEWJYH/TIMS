import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { InventoriesService } from './inventories.service';
import { Inventory } from './entities/inventory.entity';
import {
  StockAdjustInput,
  StockInInput,
  StockOutInput,
} from './dto/stock-transaction.input';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { RoleName } from 'src/commons/enums/role.enum';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from 'src/commons/guards/roles.guard';

@Resolver(() => Inventory)
export class InventoriesResolver {
  constructor(
    private readonly inventoriesService: InventoriesService, //
  ) {}

  // 특정 매장의 전체 재고 조회
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => [Inventory])
  fetchInventories(
    @Args('storeId', { type: () => Int }) storeId: number,
  ): Promise<Inventory[]> {
    return this.inventoriesService.findAllByStore(storeId);
  }

  // 특정 매장의 특정 타이어 재고 조회
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => Inventory, { nullable: true })
  fetchInventory(
    @Args('storeId', { type: () => Int }) storeId: number,
    @Args('tireId', { type: () => Int }) tireId: number,
  ): Promise<Inventory | null> {
    return this.inventoriesService.findOne(storeId, tireId);
  }

  // 입고
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Inventory)
  stockIn(
    @Args('stockInInput') stockInInput: StockInInput,
  ): Promise<Inventory> {
    return this.inventoriesService.stockIn(stockInInput);
  }

  // 출고
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Inventory)
  stockOut(
    @Args('stockOutInput') stockOutInput: StockOutInput,
  ): Promise<Inventory> {
    return this.inventoriesService.stockOut(stockOutInput);
  }

  // 조정
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Inventory)
  stockAdjust(
    @Args('stockAdjustInput') stockAdjustInput: StockAdjustInput,
  ): Promise<Inventory> {
    return this.inventoriesService.stockAdjust(stockAdjustInput);
  }
}
