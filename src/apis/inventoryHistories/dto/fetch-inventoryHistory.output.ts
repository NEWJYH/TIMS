import { Field, Int, ObjectType } from '@nestjs/graphql';
import { InventoryHistory } from '../entities/inventoryHistory.entity';

@ObjectType()
export class FetchInventoryHistoryOutput {
  @Field(() => [InventoryHistory])
  items: InventoryHistory[];

  @Field(() => Int)
  count: number;
}
