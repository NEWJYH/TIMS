import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RoleRequest } from './entities/roleRequest.entity';
import { RoleRequestsService } from './roleRequests.service';
import { CreateRoleRequestInput } from './dto/create-roleRequest.input';
import { ProcessRoleRequestInput } from './dto/process-roleRequest.input';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { RoleName } from 'src/commons/enums/role.enum';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from 'src/commons/guards/roles.guard';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RoleRequestStatus } from 'src/commons/enums/roleRequestStatus.enum';

@Resolver(() => RoleRequest)
export class RoleRequestsResolver {
  constructor(private readonly roleRequestsService: RoleRequestsService) {}

  // =================================================================
  // [Query] 조회 영역
  // =================================================================

  // STAFF, ADMIN
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => [RoleRequest])
  fetchRoleRequests(
    @CurrentUser() currentUser: User,
    @Args('status', { type: () => RoleRequestStatus, nullable: true })
    status?: RoleRequestStatus,
  ): Promise<RoleRequest[]> {
    return this.roleRequestsService.findAll({ user: currentUser, status });
  }

  // =================================================================
  // [Mutation] 생성/수정/삭제 영역
  // =================================================================

  // ADMIN
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => RoleRequest)
  processRoleRequest(
    @CurrentUser() currentUser: User,
    @Args('processRoleRequestInput')
    processRoleRequestInput: ProcessRoleRequestInput,
  ): Promise<RoleRequest> {
    return this.roleRequestsService.process({
      approverId: currentUser.id,
      processRoleRequestInput,
    });
  }

  // ALL
  @UseGuards(GqlAuthGuard('access'))
  @Mutation(() => RoleRequest)
  requestRoleChange(
    @CurrentUser() currentUser: User,
    @Args('createRoleRequestInput')
    createRoleRequestInput: CreateRoleRequestInput,
  ): Promise<RoleRequest> {
    return this.roleRequestsService.create({
      userId: currentUser.id,
      createRoleRequestInput,
    });
  }
}
