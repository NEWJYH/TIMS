import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Tire } from 'src/apis/tires/entities/tire.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tire_categories')
@ObjectType()
export class TireCategory {
  @PrimaryGeneratedColumn({ type: 'integer' })
  @Field(() => Int)
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    comment: '카테고리명 (예: PCR, SUV, LT)',
  })
  @Field(() => String)
  name: string;

  @OneToMany(() => Tire, (tire) => tire.category)
  // @Field(() => [Tire], { nullable: true }) // 카테고리 조회할 때마다 수천 개의 타이어 정보를 다 가져올 필요가 없으므로 @Field 제거
  tires: Tire[];
}
