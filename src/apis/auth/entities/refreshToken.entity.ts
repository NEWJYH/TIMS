import { User } from 'src/apis/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';

@Entity('refresh_tokens')
@Index(['tokenHash', 'isRevoked']) // 토큰 검색 및 상태 확인을 위한 인덱스 설정
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string; // 리프레시 토큰 레코드의 고유 ID

  // 보안: 실제 토큰 문자열이 아닌 해시 값을 저장해야 합니다.
  @Column({ length: 512 })
  tokenHash: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date; // 토큰 만료 시점

  @Column()
  device: string; // 예: web, ios, android

  @Column({ default: false })
  isRevoked: boolean; // 토큰 무효화 여부 (수동 로그아웃, 보안 침해 등으로 회수 시 true)

  @Column({ nullable: true })
  issuedIp: string; // 토큰 발급 IP (추가 보안 정보)

  //
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  user: User;

  // DB에 저장되는 사용자 ID (FK)
  @Column()
  userId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
