import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RolesService } from '../roles/roles.service';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IUserServiceCreate,
  IUserServiceCreateOAuth,
  // IUserServiceDeleteAccount,
  IUserServiceFindByEmail,
  IUserServiceUpdate,
} from './interfaces/users-service.interface';

import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>, //
    private readonly rolesService: RolesService,
  ) {}

  // 단일 조회 (로그인 / Strategy용)
  async findOne(userId: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['role', 'store'],
    });
  }

  // 단일 조회
  async findOneByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { phoneNumber },
      relations: ['role', 'store'],
    });
  }

  // 단일 조회
  async findOneByEmail({
    email,
  }: IUserServiceFindByEmail): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      relations: ['role', 'store'],
    });
  }

  // 단일 조회 storeId
  async findAllByStore(storeId: number): Promise<User[]> {
    return await this.usersRepository.find({
      where: { storeId },
      relations: ['role', 'store'],
      order: { name: 'ASC' },
    });
  }

  async create({ createUserInput }: IUserServiceCreate): Promise<User> {
    const { email, password, phoneNumber, name } = createUserInput;
    // 이메일 중복 체크
    // TODO : 이메일 validation
    const isExistEmail = await this.findOneByEmail({ email });
    if (isExistEmail) throw new ConflictException('이미 등록된 이메일입니다.');

    // 휴대전화 중복 체크
    // TODO : 전화번호 validation
    const isExistPhoneNumber = await this.findOneByPhoneNumber(phoneNumber);
    if (isExistPhoneNumber)
      throw new ConflictException('이미 등록된 전화번호 입니다.');

    // 권한(Role) USER 로만
    const userRole = await this.rolesService.findOneByName({ name: 'USER' });
    if (!userRole)
      throw new InternalServerErrorException(
        '기본 권한(USER) 설정 오류. 관리자에게 문의하세요.',
      );

    // 비밀번호 암호화
    const rounds = parseInt(process.env.BCRYPT_ROUNDS as string, 10);
    const hashedPassword = await bcrypt.hash(password, rounds);

    // 유저 생성 및 저장
    const newUser = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
      phoneNumber,
      role: userRole,
    });

    return await this.usersRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      relations: ['store'],
    });
  }

  async update({ userId, updateUserInput }: IUserServiceUpdate): Promise<User> {
    const { password, name, phoneNumber, currentPassword } = updateUserInput;

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    if (!user.password) {
      throw new ConflictException(
        '소셜 로그인 유저는 비밀번호 검증을 할 수 없습니다. (소셜 연동 해제 필요)',
      );
    }

    // 비밀번호 변경 요청 시 -> 암호화 다시 해서 저장
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '현재 비밀번호가 일치하지 않아 정보 수정을 할 수 없습니다.',
      );
    }
    if (password) {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      user.password = await bcrypt.hash(password, rounds);
    }

    // 전화번호 검증
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existingPhone = await this.findOneByPhoneNumber(phoneNumber);
      if (existingPhone) {
        throw new ConflictException('이미 등록된 전화번호입니다.');
      }
      user.phoneNumber = phoneNumber;
    }

    if (name) {
      // TODO : 이름 필터링 (욕설, 빈문자열 방지 및 등등)
      user.name = name;
    }

    return await this.usersRepository.save(user);
  }

  async delete(userId: string): Promise<boolean> {
    // 1. 삭제된 데이터까지 포함해서 조회
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    // 2. 아예 없는 유저인 경우
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    // 3. 이미 삭제된 유저인 경우 (중복 삭제 방지)
    if (user.deletedAt) throw new ConflictException('이미 삭제된 유저입니다.');

    // 4. 삭제 수행
    const result = await this.usersRepository.softDelete({ id: userId });
    return result.affected ? true : false;
  }

  // async deleteAccount({
  //   userId,
  //   currentPassword,
  // }: IUserServiceDeleteAccount): Promise<boolean> {
  //   const user = await this.usersRepository.findOne({ where: { id: userId } });
  //   if (!user) {
  //     throw new NotFoundException('유저를 찾을 수 없습니다.');
  //   }

  //   const isPasswordValid = await bcrypt.compare(
  //     currentPassword,
  //     user.password,
  //   );
  //   if (!isPasswordValid) {
  //     throw new UnauthorizedException(
  //       '비밀번호가 일치하지 않아 탈퇴할 수 없습니다.',
  //     );
  //   }

  //   const result = await this.usersRepository.softDelete({ id: userId });
  //   return result.affected ? true : false;
  // }

  // OAuth 회원 가입으로 생성
  // entity 변경
  async createOAuthUser({ email }: IUserServiceCreateOAuth): Promise<User> {
    const userRole = await this.rolesService.findOneByName({ name: 'USER' });

    const newUser = this.usersRepository.create({
      email,
      role: userRole!,
    });

    return await this.usersRepository.save(newUser);
  }
}
