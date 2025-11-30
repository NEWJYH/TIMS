import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from 'src/apis/users/entities/user.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
@ObjectType()
export class Role {
  @PrimaryGeneratedColumn({ type: 'integer' })
  @Field(() => Int)
  id: number;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    comment: '권한 등급 (USER, STAFF, ADMIN)',
  })
  @Field(() => String)
  name: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
