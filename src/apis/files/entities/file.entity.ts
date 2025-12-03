import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/apis/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('files')
@ObjectType()
export class File {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String)
  id: string;

  @Column({ comment: '접속 가능한 URL' })
  @Field(() => String)
  url: string;

  @Column({ comment: 'S3 내부 경로' })
  path: string;

  @Column({ comment: '원본 파일명' })
  @Field(() => String)
  name: string;

  @Column({ comment: '파일 확장자/MIME' })
  @Field(() => String)
  mimeType: string;

  // 🚀 [핵심] 누가 올렸는가?
  @Column({ name: 'user_id', type: 'varchar', length: 36, nullable: true })
  @Field(() => String, { nullable: true })
  userId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @Field(() => User, { nullable: true })
  user?: User;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
