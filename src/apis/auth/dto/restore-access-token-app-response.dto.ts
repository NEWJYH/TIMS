import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RestoreAccessTokenAppResponse {
  @Field(() => String)
  accessToken: string;
}
