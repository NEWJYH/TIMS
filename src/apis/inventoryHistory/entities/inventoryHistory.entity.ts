import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Inventory } from 'src/apis/inventories/entities/inventory.entity';
import { InventoryHistoryType } from 'src/apis/inventoryHistoryTypes/entities/inventoryHistoryType.entity';
import { User } from 'src/apis/users/entities/user.entity';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('inventory_history')
@ObjectType()
export class InventoryHistory {
  @PrimaryGeneratedColumn({ type: 'integer' })
  @Field(() => Int)
  id: number;

  // 인벤토리 (M:1)
  @Column({ name: 'inventory_id' })
  @Field(() => Int)
  inventoryId: number;

  @ManyToOne(() => Inventory, (inventory) => inventory.histories)
  @JoinColumn({ name: 'inventory_id' })
  @Field(() => Inventory)
  inventory: Inventory;

  // 작업자 (M:1)
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  @Field(() => String)
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @Column({ name: 'inventory_history_type_id' })
  @Field(() => Int)
  typeId: number;

  @ManyToOne(() => InventoryHistoryType)
  @JoinColumn({ name: 'inventory_history_type_id' })
  @Field(() => InventoryHistoryType)
  type: InventoryHistoryType;

  // 변동 수량 (+100 또는 -100)
  @Column({ name: 'quantity_change' })
  @Field(() => Int)
  quantityChange: number;

  // 변동 후 잔여량 (스냅샷)
  @Column({ name: 'current_quantity' })
  @Field(() => Int)
  currentQuantity: number;

  // 메모
  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  memo?: string;

  // 생성일
  @CreateDateColumn({ name: 'created_at' })
  @Field(() => Date)
  createdAt: Date;
}
