import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InventoryHistoriesService } from './inventoryHistories.service';
import { InventoryHistory } from './entities/inventoryHistory.entity';
import { FetchInventoryHistoryInput } from './dto/fetch-inventoryHistory.input';
import { FetchInventoryHistoryOutput } from './dto/fetch-inventoryHistory.output';
import { GqlAuthGuard } from 'src/apis/auth/guards/gql-auth.guard';
import { RolesGuard } from 'src/commons/guards/roles.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { RoleName } from 'src/commons/enums/role.enum';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => InventoryHistory)
export class InventoryHistoriesResolver {
  constructor(
    private readonly inventoryHistoriesService: InventoryHistoriesService,
  ) {}
  // =================================================================
  // [Query] 조회 영역
  // =================================================================

  // USSER, STAFF, ADMIN
  @Roles(RoleName.USER, RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => FetchInventoryHistoryOutput)
  fetchInventoryHistories(
    @CurrentUser() currentUser: User, //
    @Args('fetchInventoryHistoryInput')
    fetchInventoryHistoryInput: FetchInventoryHistoryInput,
  ): Promise<FetchInventoryHistoryOutput> {
    return this.inventoryHistoriesService.findAll({
      user: currentUser,
      fetchInventoryHistoryInput,
    });
  }
}
