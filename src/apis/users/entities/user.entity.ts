import { Field, Int, ObjectType } from '@nestjs/graphql';
import { InventoryHistory } from 'src/apis/inventoryHistory/entities/inventoryHistory.entity';
import { Role } from 'src/apis/roles/entities/role.entity';
import { Store } from 'src/apis/stores/entities/store.entity';
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

@Entity('users')
@ObjectType()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String)
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    comment: '이메일(로그인ID)',
  })
  @Field(() => String)
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '비밀번호(Bcrypt Hashed)',
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '사용자 실명',
  })
  @Field(() => String)
  name: string;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 20,
    comment: '휴대전화번호',
  })
  @Field(() => String)
  phoneNumber: string;

  @Column({ name: 'role_id', comment: '권한 FK' })
  @Field(() => Int)
  roleId: number;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  @Field(() => Role)
  role: Role;

  @Column({ name: 'store_id', nullable: true, comment: '소속 매장 FK' })
  @Field(() => Int, { nullable: true })
  storeId?: number | null;

  @ManyToOne(() => Store, (store) => store.users, { nullable: true })
  @JoinColumn({ name: 'store_id' })
  @Field(() => Store, { nullable: true })
  store?: Store;

  // @Field(() => [InventoryHistory], { nullable: true })
  @OneToMany(() => InventoryHistory, (history) => history.user)
  histories: InventoryHistory[];

  @CreateDateColumn({ name: 'created_at', comment: '가입일' })
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '정보 수정일' })
  @Field(() => Date)
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', comment: '탈퇴일' })
  @Field(() => Date, { nullable: true })
  deletedAt: Date;
}
