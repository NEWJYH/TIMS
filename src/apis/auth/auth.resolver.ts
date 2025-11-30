import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { IContext } from 'src/commons/interfaces/context';
import { AuthService } from './auth.service';

@Resolver()
export class AuthResolver {
  //
  constructor(
    private readonly authService: AuthService, //
  ) {}
  //

  @Mutation(() => String)
  login(
    @Args('email') email: string, //
    @Args('password') password: string,
    @Context() context: IContext,
  ): Promise<string> {
    return this.authService.login({ email, password, context });
  }

  @UseGuards(GqlAuthGuard('refresh'))
  @Mutation(() => String)
  restoreAcessToken(
    @Context() context: IContext, //
  ): string {
    return this.authService.restoreAccessToken({ user: context.req.user });
  }

  @UseGuards(GqlAuthGuard('access'))
  @Mutation(() => String)
  logout(
    @Context() context: IContext, //
  ): string {
    return this.authService.logout({ context });
  }
}
