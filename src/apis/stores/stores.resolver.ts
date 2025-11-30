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

@Resolver(() => Store)
export class StoresResolver {
  constructor(
    private readonly storesService: StoresService, //
  ) {}

  @UseGuards(GqlAuthGuard('access'))
  @Query(() => [Store])
  fetchStores(): Promise<Store[]> {
    return this.storesService.findAll();
  }

  @UseGuards(GqlAuthGuard('access'))
  @Query(() => Store, { nullable: true })
  fetchStore(
    @Args('storeId', { type: () => Int }) storeId: number,
  ): Promise<Store> {
    return this.storesService.findOne(storeId);
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Store)
  createStore(
    @Args('createStoreInput') createStoreInput: CreateStoreInput,
  ): Promise<Store> {
    return this.storesService.create({ createStoreInput });
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Store)
  updateStore(
    @Args('updateStoreInput') updateStoreInput: UpdateStoreInput,
  ): Promise<Store> {
    return this.storesService.update({ updateStoreInput });
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
