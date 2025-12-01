import {
  BadRequestException,
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
  IUserServiceDeleteAccount,
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

  // STAFF (점주)가 직원 검색
  async findMyStoreUsers(user: User): Promise<User[]> {
    if (!user.storeId) {
      throw new BadRequestException('소속된 매장이 없습니다.');
    }

    return await this.usersRepository.find({
      where: { storeId: user.storeId },
      relations: ['role', 'store'],
      order: { createdAt: 'ASC' },
    });
  }

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

  // 단일 조회 storeId - 관리자 전용
  async findAllByStore(storeId: number): Promise<User[]> {
    return await this.usersRepository.find({
      where: { storeId },
      relations: ['role', 'store'],
      order: { name: 'ASC' },
    });
  }

  // 일반 회원 가입
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
    const { password, name, phoneNumber, position, currentPassword } =
      updateUserInput;

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
    // 1. 직급 변경 (단순 정보)
    if (position) user.position = position;

    // 2. 비밀번호 변경
    if (password || currentPassword) {
      // 소셜 로그인 유저일 겨우
      if (!user.password) {
        throw new ConflictException(
          '소셜 로그인 유저는 비밀번호 변경/검증할 수 없습니다.',
        );
      }

      // 일반 유저인데 비밀번호를 보내지 않은 경우
      if (!currentPassword) {
        throw new BadRequestException(
          '정보를 수정(비밀번호 변경)하려면 현재 비밀번호를 입력해야 합니다.',
        );
      }

      // 일반 유저 - 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException(
          '현재 비밀번호가 일치하지 않아 정보 수정을 할 수 없습니다.',
        );
      }
      // 검증 통과 후,  새비밀번호로 변경
      if (password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS as string, 10);
        user.password = await bcrypt.hash(password, rounds);
      }
    }

    // 3. 전화번호 변경
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existingPhone = await this.findOneByPhoneNumber(phoneNumber);
      if (existingPhone) {
        throw new ConflictException('이미 등록된 전화번호입니다.');
      }
      user.phoneNumber = phoneNumber;
    }

    // 4. 이름 변경
    if (name) user.name = name;

    return await this.usersRepository.save(user);
  }

  // 관리자 전용
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

  // 회원 탈퇴
  async deleteAccount({
    userId,
    currentPassword,
  }: IUserServiceDeleteAccount): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    // 일반 유저일 경우 비밀번호 인증
    if (user.password) {
      // 1. 일반 유저인데 비밀번호를 안 보냈다면? -> 에러!
      if (!currentPassword) {
        throw new BadRequestException('탈퇴하려면 비밀번호를 입력해야 합니다.');
      }

      // 2. 비밀번호가 틀렸다면? -> 에러!
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException(
          '비밀번호가 일치하지 않아 탈퇴할 수 없습니다.',
        );
      }
    }

    const result = await this.usersRepository.softDelete({ id: userId });
    return result.affected ? true : false;
  }

  // OAuth 회원 가입으로 생성
  async createOAuthUser({ email }: IUserServiceCreateOAuth): Promise<User> {
    const userRole = await this.rolesService.findOneByName({ name: 'USER' });

    const newUser = this.usersRepository.create({
      email,
      role: userRole!,
    });

    return await this.usersRepository.save(newUser);
  }
}
