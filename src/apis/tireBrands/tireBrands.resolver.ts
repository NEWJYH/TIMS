import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TireBrand } from './entities/tireBrand.entity';
import { TireBrandsService } from './tireBrands.service';
import { CreateTireBrandInput } from './dto/create-tireBrand.input';
import { UpdateTireBrandInput } from './dto/update-tireBrand.input';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { RoleName } from 'src/commons/enums/role.enum';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/commons/guards/roles.guard';

@Resolver(() => TireBrand)
export class TireBrandsResolver {
  constructor(private readonly tireBrandsService: TireBrandsService) {}

  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => [TireBrand])
  fetchTireBrands(): Promise<TireBrand[]> {
    return this.tireBrandsService.findAll();
  }

  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => TireBrand)
  fetchTireBrand(
    @Args('tireBrandId') tireBrandId: number, //
  ): Promise<TireBrand> {
    return this.tireBrandsService.findOne(tireBrandId);
  }

  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => TireBrand)
  createTireBrand(
    @Args('createTireBrandInput') createTireBrandInput: CreateTireBrandInput,
  ): Promise<TireBrand> {
    return this.tireBrandsService.create({ createTireBrandInput });
  }

  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => TireBrand)
  updateTireBrand(
    @Args('updateTireBrandInput') updateTireBrandInput: UpdateTireBrandInput,
  ): Promise<TireBrand> {
    return this.tireBrandsService.update({ updateTireBrandInput });
  }
}
