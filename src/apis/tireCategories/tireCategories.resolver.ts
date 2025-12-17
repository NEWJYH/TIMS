import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TireCategoriesService } from './tireCategories.service';
import { TireCategory } from './entities/tireCategory.entity';
import { CreateTireCategoryInput } from './dto/create-tireCategory.input';
import { UpdateTireCategoryInput } from './dto/update-tireCategory.input';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { RoleName } from 'src/commons/enums/role.enum';
import { RolesGuard } from 'src/commons/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => TireCategory)
export class TireCategoriesResolver {
  constructor(
    private readonly tireCategoriesService: TireCategoriesService, //
  ) {}

  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => TireCategory)
  fetchTireCategory(
    @Args('tireCategoryId', { type: () => Int }) tireCategoryId: number, //
  ): Promise<TireCategory | null> {
    return this.tireCategoriesService.findOne(tireCategoryId);
  }

  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => [TireCategory])
  fetchTireCategories(): Promise<TireCategory[]> {
    return this.tireCategoriesService.findAll();
  }

  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => TireCategory)
  createTireCategory(
    @Args('createTireCategoryInput')
    createTireCategoryInput: CreateTireCategoryInput, //
  ): Promise<TireCategory> {
    return this.tireCategoriesService.create({ createTireCategoryInput });
  }

  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => TireCategory)
  updateTireCategory(
    @Args('updateTireCategoryInput')
    updateTireCategoryInput: UpdateTireCategoryInput, //
  ): Promise<TireCategory> {
    return this.tireCategoriesService.update({ updateTireCategoryInput });
  }
}
