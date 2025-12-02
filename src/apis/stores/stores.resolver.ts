import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { StoresService } from './stores.service';
import { Store } from './entities/store.entity';
import { CreateStoreInput } from './dto/create-store.input';
import { UpdateStoreInput } from './dto/update-store.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from 'src/commons/guards/roles.guard';
import { RoleName } from 'src/commons/enums/role.enum';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';

@Resolver(() => Store)
export class StoresResolver {
  constructor(
    private readonly storesService: StoresService, //
  ) {}

  // =================================================================
  // [Query] 조회 영역
  // =================================================================

  @Roles(RoleName.USER, RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => [Store])
  fetchStores(
    @CurrentUser() currentUser: User, //
  ): Promise<Store[]> {
    return this.storesService.findAll(currentUser);
  }

  @Roles(RoleName.USER, RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => Store, { nullable: true })
  fetchStore(
    @CurrentUser() currentUser: User, //
    @Args('storeId', { type: () => Int, nullable: true }) storeId?: number,
  ): Promise<Store> {
    return this.storesService.findMyStore(currentUser, storeId);
  }

  // =================================================================
  // [Mutation] 생성/수정/삭제 영역
  // =================================================================

  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Store)
  createStore(
    @Args('createStoreInput') createStoreInput: CreateStoreInput,
  ): Promise<Store> {
    return this.storesService.create({ createStoreInput });
  }

  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Store)
  updateStore(
    @CurrentUser() currentUser: User,
    @Args('updateStoreInput') updateStoreInput: UpdateStoreInput,
  ): Promise<Store> {
    return this.storesService.update({ user: currentUser, updateStoreInput });
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Boolean)
  deleteStore(
    @Args('storeId', { type: () => Int }) storeId: number,
  ): Promise<boolean> {
    return this.storesService.delete(storeId);
  }
}
