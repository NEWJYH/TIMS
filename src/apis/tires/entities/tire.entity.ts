import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Inventory } from 'src/apis/inventories/entities/inventory.entity';
import { TireBrand } from 'src/apis/tireBrands/entities/tireBrand.entity';
import { TireCategory } from 'src/apis/tireCatetories/entities/tireCategory.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tires')
@ObjectType()
export class Tire {
  @PrimaryGeneratedColumn({ type: 'integer' })
  @Field(() => Int)
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '타이어 모델명 (예: 엔페라 SU1)',
  })
  @Field(() => String)
  name: string;

  // (ManyToOne)
  @Column({ name: 'brand_id', comment: '브랜드 FK' })
  @Field(() => Int)
  brandId: number;

  @ManyToOne(() => TireBrand, { eager: true })
  @JoinColumn({ name: 'brand_id' })
  @Field(() => TireBrand)
  brand: TireBrand;

  // (ManyToOne)
  @Column({ name: 'category_id', comment: '카테고리 FK' })
  @Field(() => Int)
  categoryId: number;

  @ManyToOne(() => TireCategory, { eager: true })
  @JoinColumn({ name: 'category_id' })
  @Field(() => TireCategory)
  category: TireCategory;

  @Column({ type: 'int', comment: '단면폭 (예: 245)' })
  @Field(() => Int)
  width: number;

  @Column({ name: 'aspect_ratio', comment: '편평비 (예: 45)', nullable: true })
  @Field(() => Int, { nullable: true })
  aspectRatio?: number;

  @Column({ comment: '인치 (예: 18)' })
  @Field(() => Int)
  diameter: number;

  @Column({ name: 'ply_rating', nullable: true })
  @Field(() => String, { nullable: true })
  plyRating?: string;

  @OneToMany(() => Inventory, (inventory) => inventory.tire)
  // @Field(() => [Inventory], { nullable: true })
  inventories: Inventory[];

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Field()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  @Field({ nullable: true })
  deletedAt: Date;
}
