import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Role } from 'src/apis/roles/entities/role.entity';
import { Store } from 'src/apis/stores/entities/store.entity';
import { User } from 'src/apis/users/entities/user.entity';
import { RoleRequestStatus } from 'src/commons/enums/roleRequestStatus.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('role_requests')
@ObjectType()
export class RoleRequest {
  @PrimaryGeneratedColumn({ type: 'integer' })
  @Field(() => Int)
  id: number;

  // User
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  @Field(() => String)
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @Field(() => User)
  user: User;

  @Column({
    name: 'store_id',
    type: 'int',
    nullable: true,
    comment: '희망 매장 ID',
  })
  @Field(() => Int, { nullable: true })
  storeId?: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  @Field(() => Store, { nullable: true })
  store?: Store;

  // Role
  @Column({ name: 'role_id' })
  @Field(() => Int)
  roleId: number;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  @Field(() => Role)
  role: Role;

  // 상태 (PENDING, APPROVED, REJECTED)
  @Column({
    type: 'varchar',
    length: 20,
    default: RoleRequestStatus.PENDING,
    comment: '요청 상태 (PENDING/APPROVED/REJECTED)',
  })
  @Field(() => RoleRequestStatus)
  status: RoleRequestStatus;

  // admin(처리자)
  @Column({
    name: 'processed_by_id',
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  @Field(() => String, { nullable: true })
  processedById?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'processed_by_id' })
  @Field(() => User, { nullable: true })
  processedBy?: User;

  // 4. 처리 시간 및 생성 시간
  @CreateDateColumn({ name: 'created_at', comment: '요청일' })
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn({ name: 'processed_at', comment: '처리일' })
  @Field(() => Date)
  processedAt: Date;
}
