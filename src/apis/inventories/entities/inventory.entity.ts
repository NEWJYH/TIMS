import { Field, Int, ObjectType } from '@nestjs/graphql';
import { InventoryHistory } from 'src/apis/inventoryHistories/entities/inventoryHistory.entity';
import { Store } from 'src/apis/stores/entities/store.entity';
import { Tire } from 'src/apis/tires/entities/tire.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventories')
@ObjectType()
@Unique(['storeId', 'tireId']) // 유니크 키
export class Inventory {
  @PrimaryGeneratedColumn({ type: 'integer' })
  @Field(() => Int)
  id: number;

  @Column({ name: 'store_id' })
  @Field(() => Int)
  storeId: number;

  @ManyToOne(() => Store, { eager: true })
  @JoinColumn({ name: 'store_id' })
  @Field(() => Store)
  store: Store;

  @Column({ name: 'tire_id' })
  @Field(() => Int)
  tireId: number;

  @ManyToOne(() => Tire, { eager: true })
  @JoinColumn({ name: 'tire_id' })
  @Field(() => Tire)
  tire: Tire;

  @Column({ default: 0, comment: '현재 재고 수량' })
  @Field(() => Int)
  quantity: number;

  @Column({
    name: 'location_code',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '창고 위치 (예: A-01)',
  })
  @Field(() => String, { nullable: true })
  locationCode?: string;

  @OneToMany(() => InventoryHistory, (history) => history.inventory)
  // @Field(() => [InventoryHistory], { nullable: true })
  histories: InventoryHistory[];

  @CreateDateColumn({ name: 'created_at' })
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Field(() => Date)
  updatedAt: Date;
}
