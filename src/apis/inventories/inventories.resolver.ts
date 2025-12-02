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
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Inventory)
export class InventoriesResolver {
  constructor(
    private readonly inventoriesService: InventoriesService, //
  ) {}

  // =================================================================
  // [Query] 조회 영역
  // =================================================================

  // USER, STAFF, ADMIN
  @Roles(RoleName.USER, RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => [Inventory])
  fetchInventories(
    @CurrentUser() currentUser: User,
    @Args('storeId', { type: () => Int, nullable: true }) storeId?: number,
  ): Promise<Inventory[]> {
    return this.inventoriesService.findAll(currentUser, storeId);
  }

  // USER, STAFF, ADMIN
  @Roles(RoleName.USER, RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => Inventory, { nullable: true })
  fetchInventory(
    @CurrentUser() currentUser: User,
    @Args('tireId', { type: () => Int }) tireId: number,
    @Args('storeId', { type: () => Int, nullable: true }) storeId?: number,
  ): Promise<Inventory | null> {
    return this.inventoriesService.findOne(currentUser, tireId, storeId);
  }

  // =================================================================
  // [Mutation] 생성/수정/삭제 영역
  // =================================================================

  // USER, STAFF, ADMIN
  @Roles(RoleName.USER, RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Inventory)
  stockIn(
    @CurrentUser() currentUser: User, //
    @Args('stockInInput') stockInInput: StockInInput,
  ): Promise<Inventory> {
    return this.inventoriesService.stockIn(currentUser, stockInInput);
  }

  // USER, STAFF, ADMIN
  @Roles(RoleName.USER, RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Inventory)
  stockOut(
    @CurrentUser() currentUser: User, //
    @Args('stockOutInput') stockOutInput: StockOutInput,
  ): Promise<Inventory> {
    return this.inventoriesService.stockOut(currentUser, stockOutInput);
  }

  // USER, STAFF, ADMIN
  @Roles(RoleName.USER, RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Inventory)
  stockAdjust(
    @CurrentUser() currentUser: User, //
    @Args('stockAdjustInput') stockAdjustInput: StockAdjustInput,
  ): Promise<Inventory> {
    return this.inventoriesService.stockAdjust(currentUser, stockAdjustInput);
  }
}
