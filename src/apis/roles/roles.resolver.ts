import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { CreateRoleInput } from './dto/create-role.input';
import { UpdateRoleInput } from './dto/update-role.input';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { RoleName } from 'src/commons/enums/role.enum';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from 'src/commons/guards/roles.guard';
import { UseGuards } from '@nestjs/common';

@Resolver(() => Role)
export class RolesResolver {
  constructor(
    private readonly rolesService: RolesService, //
  ) {}

  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => [Role])
  fetchRoles(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => Role, { nullable: true })
  fetchRole(@Args('name') name: string): Promise<Role | null> {
    return this.rolesService.findOneByName({ name });
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Role)
  createRole(
    @Args('createRoleInput') createRoleInput: CreateRoleInput, //
  ) {
    return this.rolesService.create({ createRoleInput });
  }

  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Role)
  updateRole(
    @Args('updateRoleInput') updateRoleInput: UpdateRoleInput,
  ): Promise<Role> {
    return this.rolesService.update({ updateRoleInput });
  }
}
