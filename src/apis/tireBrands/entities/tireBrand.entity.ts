import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Tire } from 'src/apis/tires/entities/tire.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tire_brands')
@ObjectType()
export class TireBrand {
  @PrimaryGeneratedColumn({ type: 'integer' })
  @Field(() => Int)
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: '브랜드명 (예: 한국, 금호, 넥센)',
  })
  @Field(() => String)
  name: string;

  // @Field(() => [Tire], { nullable: true })
  @OneToMany(() => Tire, (tire) => tire.brand)
  tires: Tire[];
}
