import { Field, Int, ObjectType } from '@nestjs/graphql';
import { InventoryHistory } from 'src/apis/inventoryHistory/entities/inventoryHistory.entity';
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity('inventory_history_types')
@ObjectType()
export class InventoryHistoryType {
  @PrimaryGeneratedColumn({ type: 'integer' })
  @Field(() => Int)
  id: number;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    comment: '이력 유형 (IN, OUT, ADJUST)',
  })
  @Field(() => String)
  name: string; // IN, OUT, ADJUST

  @OneToMany(() => InventoryHistory, (history) => history.type)
  histories: InventoryHistory[];
}
