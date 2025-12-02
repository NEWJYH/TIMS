import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Inventory } from 'src/apis/inventories/entities/inventory.entity';
import { User } from 'src/apis/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stores')
@ObjectType()
export class Store {
  @PrimaryGeneratedColumn({ type: 'integer' })
  @Field(() => Int)
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '매장명 (예: 매곡점)',
  })
  @Field(() => String)
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '주소',
  })
  @Field(() => String)
  address: string;

  // 수정할수있음.
  @Column({
    name: 'tele_phone_number',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '전화번호',
  })
  @Field(() => String, { nullable: true })
  telePhoneNumber?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '지점 코드',
  })
  @Field(() => String, { nullable: true })
  code?: string;

  @Column({
    name: 'business_license_url',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '사업자등록증 이미지 URL',
  })
  @Field(() => String, { nullable: true })
  businessLicenseUrl?: string;

  @Column({
    name: 'is_active',
    default: true,
    comment: '운영 여부',
  })
  @Field(() => Boolean)
  isActive: boolean;

  @OneToMany(() => User, (user) => user.store)
  users: User[];

  @OneToMany(() => Inventory, (inventory) => inventory.store)
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
