import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { RoleName } from 'src/commons/enums/role.enum';
import { RolesGuard } from 'src/commons/guards/roles.guard';
import { CurrentUser } from 'src/commons/decorators/current-user.decorator';
import { DeletUserInput } from './dto/delete-user.input';
@Resolver()
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService, //
  ) {}

  // 관리자
  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => [User])
  fetchUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // 관리자 (추방)
  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Mutation(() => Boolean)
  deleteUser(
    @Args('userId') userId: string, //
  ): Promise<boolean> {
    return this.usersService.delete(userId);
  }

  // 관리자
  @Roles(RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => User, { nullable: true })
  fetchUserByEmail(
    @Args('email') email: string, //
  ): Promise<User | null> {
    return this.usersService.findOneByEmail({ email });
  }

  // 직원, 관리자
  // 특정 매장 직원 조회
  @Roles(RoleName.STAFF, RoleName.ADMIN)
  @UseGuards(GqlAuthGuard('access'), RolesGuard)
  @Query(() => [User])
  fetchUsersByStore(
    @Args('storeId', { type: () => Int }) storeId: number,
  ): Promise<User[]> {
    return this.usersService.findAllByStore(storeId);
  }

  // 유저
  @UseGuards(GqlAuthGuard('access'))
  @Query(() => User)
  fetchUser(@CurrentUser() currentUser: User): User {
    return currentUser;
  }

  // 유저
  @UseGuards(GqlAuthGuard('access'))
  @Mutation(() => User)
  updateUser(
    @CurrentUser() currentUser: User, //
    @Args('updateUserInput') updateUserInput: UpdateUserInput, //
  ): Promise<User> {
    const userId = currentUser.id;
    return this.usersService.update({ userId, updateUserInput });
  }

  // 유저
  @UseGuards(GqlAuthGuard('access'))
  @Mutation(() => Boolean)
  deleteAccount(
    @CurrentUser() currentUser: User,
    @Args('deleteUserInput') deleteUserInput: DeletUserInput,
  ): Promise<boolean> {
    return this.usersService.deleteAccount({
      userId: currentUser.id,
      currentPassword: deleteUserInput.currentPassword,
    });
  }

  // 누구나
  @Mutation(() => User)
  createUser(
    @Args('createUserInput') createUserInput: CreateUserInput, //
  ): Promise<User> {
    return this.usersService.create({ createUserInput });
  }
}
