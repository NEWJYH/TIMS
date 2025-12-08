import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { DataSource } from 'typeorm';
import { RolesService } from '../../roles/roles.service';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Store } from 'src/apis/stores/entities/store.entity';
import { RoleRequestStatus } from 'src/commons/enums/roleRequestStatus.enum';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: any;
  let rolesService: any;

  const mockUsersRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockRolesService = {
    findOne: jest.fn(),
    findOneByName: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
      },
    }),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        // (1) User Repository
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        // (2) ★ RolesService (여기서 에러 났었음)
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        // (3) DataSource
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    rolesService = module.get(RolesService);

    jest.resetAllMocks();

    mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneByEmail', () => {
    it('이메일이 존재하면 유저를 반환해야 한다', async () => {
      const email = 'test@test.com';
      const mockUser = { id: '1', email };

      // 가짜 데이터 리턴 설정
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail({ email });

      expect(result).toEqual(mockUser);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email },
        relations: ['role', 'store'],
      });
    });

    it('이메일이 없으면 null을 반환해야 한다', async () => {
      const email = 'notfound@test.com';
      // 가짜 데이터: 없음(null)
      mockUsersRepository.findOne.mockResolvedValue(null);
      const result = await service.findOneByEmail({ email });
      expect(result).toBeNull();
    });
  });

  describe('findOneByPhoneNumber', () => {
    const phoneNumber = '010-1234-5678';
    const mockUser = { id: '1', email: 'teset@test.com', phoneNumber };

    it('휴대폰 번호가 존재하면 유저를 반환하여야 한다.', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findOneByPhoneNumber(phoneNumber);

      expect(result).toEqual(mockUser);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { phoneNumber },
        relations: ['role', 'store'],
      });
    });

    it('휴대폰 번호가 존재하지 않으면 null을 반환해야한다.', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      const result = await service.findOneByPhoneNumber(phoneNumber);

      expect(result).toBeNull();
    });
  });

  describe('createOAuthUser', () => {
    const email = 'test@example.com';

    it('이미 가입된 유저라면, 저장 로직 없이 해당 유저를 반환한다.', async () => {
      // Given
      const existingUser = { id: 'user-1', email };
      mockUsersRepository.findOne.mockResolvedValue(existingUser);
      // When
      const result = await service.createOAuthUser({ email });
      // Then
      expect(result).toEqual(existingUser);
      expect(rolesService.findOneByName).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
    it('USER Role이 DB에 없으면 에러(UnprocessableEntityException)를 던진다.', async () => {
      // Given
      mockUsersRepository.findOne.mockResolvedValue(null);
      mockRolesService.findOneByName.mockResolvedValue(null);

      // When & Then
      await expect(service.createOAuthUser({ email })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
    it('신규 유저이고 Role이 존재한다면, 유저를 생성하고 저장 후 반환한다.', async () => {
      // Given
      const mockRole = { id: '1', name: 'USER' };
      const newUser = { id: 'user-2', email, role: mockRole };

      mockUsersRepository.findOne.mockResolvedValue(null); // 유저 없음 (신규)
      mockRolesService.findOneByName.mockResolvedValue(mockRole); // Role 있음

      mockUsersRepository.create.mockReturnValue(newUser); // create는 객체만 리턴 (동기)
      mockUsersRepository.save.mockResolvedValue(newUser); // save는 DB 다녀오니 Promise (비동기)

      // When
      const result = await service.createOAuthUser({ email });

      // Then
      expect(result).toEqual(newUser);

      // 순서대로 잘 호출되었는지 확인
      expect(rolesService.findOneByName).toHaveBeenCalledWith({ name: 'USER' });
      expect(usersRepository.create).toHaveBeenCalledWith({
        email,
        role: mockRole,
      });
      expect(usersRepository.save).toHaveBeenCalledWith(newUser);
    });
  });

  describe('onboarduser', () => {
    const userId = 'user-uuid';
    const baseInput = {
      name: '홍길동',
      position: '매니저',
    };

    // 공통 Mock User
    const mockUser = { id: userId, storeId: null, name: null, position: null };
    const cleanUser = { id: userId, storeId: null, name: null, position: null };

    it('사장님은 매장을 생성하고 STAFF 권한을 요청한다', async () => {
      // Given
      const input = {
        ...baseInput,
        isCEO: true,
        storeName: '내매장',
        storeAddress: '서울',
      };
      const createdStore = { id: 1, name: '내매장' };
      const staffRole = { id: 2, name: 'STAFF' };

      // 순서대로 Mocking (findOne이 여러번 호출됨)
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(mockUser) // 1. 유저 조회
        .mockResolvedValueOnce(null) // 2. 기존 요청 조회 (없음)
        .mockResolvedValueOnce(staffRole); // 3. 권한 조회 (STAFF)

      mockQueryRunner.manager.create.mockReturnValue(createdStore); // 매장 create
      mockQueryRunner.manager.save.mockResolvedValue(createdStore); // 매장/유저/요청 save

      // When
      const result = await service.onboardUser(userId, input as any);

      // Then
      expect(result).toBe(true);
      // 트랜잭션 사이클 확인
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      // 로직 확인
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        Store,
        expect.objectContaining({
          name: '내매장',
          isActive: true,
        }),
      ); // 매장 생성 확인
      expect(mockQueryRunner.manager.save).toHaveBeenCalled(); // 저장 호출 확인
    });

    it('직원은 기존 매장을 조회하고 USER 권한을 요청한다', async () => {
      // Given
      const input = {
        ...baseInput,
        isCEO: false,
        storeId: 2,
      };
      const existingStore = { id: 2 };
      const userRole = { id: 1, name: 'USER' };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(cleanUser) // 1. 유저 조회
        .mockResolvedValueOnce(null) // 2. 기존 요청 조회
        .mockResolvedValueOnce(existingStore) // 3. 매장 조회
        .mockResolvedValueOnce(userRole); // 4. 권한 조회 (USER)

      // When
      const result = await service.onboardUser(userId, input as any);

      // Then
      expect(result).toBe(true);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();

      // 매장을 새로 생성하지 않았는지 확인
      expect(mockQueryRunner.manager.create).not.toHaveBeenCalledWith(
        Store,
        expect.anything(),
      );
    });

    it('유저가 존재하지 않으면 NotFoundException을 던진다', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // 유저 없음

      await expect(
        service.onboardUser(userId, baseInput as any),
      ).rejects.toThrow(NotFoundException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled(); // 롤백 확인
      expect(mockQueryRunner.release).toHaveBeenCalled(); // 릴리즈 확인
    });

    it('이미 소속된 매장이 있으면 ConflictException을 던진다', async () => {
      const joinedUser = { ...mockUser, storeId: 'already-joined' };
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(joinedUser);

      await expect(
        service.onboardUser(userId, baseInput as any),
      ).rejects.toThrow(ConflictException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('이미 대기 중인 요청이 있으면 ConflictException을 던진다', async () => {
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(mockUser) // 유저 있음
        .mockResolvedValueOnce({
          id: 'req-1',
          status: RoleRequestStatus.PENDING,
        }); // 요청 있음

      await expect(
        service.onboardUser(userId, baseInput as any),
      ).rejects.toThrow(ConflictException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('사장님인데 매장 정보가 누락되면 BadRequestException을 던진다', async () => {
      // Given
      const invalidInput = { ...baseInput, isCEO: true, storeName: '' }; // 주소 누락
      const cleanUser = {
        id: userId,
        storeId: null,
        name: null,
        position: null,
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ ...cleanUser }) // 1. 유저 조회 (성공해야 함)
        .mockResolvedValueOnce(null); // 2. 기존 요청 조회 (없음)

      // When & Then
      await expect(
        service.onboardUser(userId, invalidInput as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('직원인데 매장ID가 누락되면 BadRequestException을 던진다', async () => {
      // Given
      const invalidInput = { ...baseInput, isCEO: false }; // storeId 누락
      const userWithoutStore = { id: userId, storeId: null };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(userWithoutStore)
        .mockResolvedValueOnce(null);

      await expect(
        service.onboardUser(userId, invalidInput as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('DB에 권한 정보(Role)가 없으면 InternalServerErrorException을 던진다', async () => {
      const input = { ...baseInput, isCEO: false, storeId: 's1' };
      const userWithoutStore = { id: userId, storeId: null };
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(userWithoutStore)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 's1' }) // 매장 있음
        .mockResolvedValueOnce(null); // 🚨 Role 정보 없음 (DB 사고)

      await expect(service.onboardUser(userId, input as any)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('로직 중간에 DB 에러가 발생하면 롤백해야 한다', async () => {
      // Given
      const input = {
        ...baseInput,
        isCEO: true,
        storeName: 'test',
        storeAddress: 'addr',
      };
      const safeUser = {
        id: userId,
        storeId: null,
        name: null,
        position: null,
      };

      // Mock 시나리오 설정
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(safeUser) // 저 조회
        .mockResolvedValueOnce(null); // 기존 요청 조회

      // create는 단순 객체 반환
      mockQueryRunner.manager.create.mockReturnValue({ name: 'store' });

      // save 호출 여기서 에러
      mockQueryRunner.manager.save.mockRejectedValue(
        new Error('DB Connection Fail'),
      );

      // When & Then
      await expect(service.onboardUser(userId, input as any)).rejects.toThrow(
        'DB Connection Fail',
      );

      // 롤백이 호출되었는지 확인
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
