import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TiresService } from './tires.service';
import { Tire } from './entities/tire.entity';
import { CreateTireInput } from './dto/create-tire.input';
import { UpdateTireInput } from './dto/update-tire.input';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from 'src/commons/guards/roles.guard';
import { RoleName } from 'src/commons/enums/role.enum';

@Resolver(() => Tire)
export class TiresResolver {
  constructor(private readonly tiresService: TiresService) {}

  // 직원 이상
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => [Tire])
  fetchTires(): Promise<Tire[]> {
    return this.tiresService.findAll();
  }

  // 직원 이상
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => Tire, { nullable: true })
  fetchTire(
    @Args('id', { type: () => Int }) id: number, //
  ): Promise<Tire | null> {
    return this.tiresService.findOne(id);
  }

  // 직원 이상
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Tire)
  createTire(
    @Args('createTireInput') createTireInput: CreateTireInput,
  ): Promise<Tire> {
    return this.tiresService.create({ createTireInput });
  }

  // 직원 이상
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Tire)
  updateTire(
    @Args('updateTireInput') updateTireInput: UpdateTireInput,
  ): Promise<Tire> {
    return this.tiresService.update({ updateTireInput });
  }

  // 직원 이상
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Boolean)
  deleteTire(
    @Args('id', { type: () => Int }) id: number, //
  ): Promise<boolean> {
    return this.tiresService.delete(id);
  }
}
