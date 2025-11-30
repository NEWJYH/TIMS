import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { RolesService } from '../roles/roles.service';
import { StoresService } from '../stores/stores.service';
import { RoleRequest } from './entities/roleRequest.entity';
import {
  IRoleRequestsServiceCreate,
  IRoleRequestsServiceProcess,
} from './interfaces/roleRequests-service.interface';
import { RoleRequestStatus } from 'src/commons/enums/roleRequestStatus.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class RoleRequestsService {
  constructor(
    @InjectRepository(RoleRequest)
    private readonly roleRequestRepository: Repository<RoleRequest>,
    private readonly rolesService: RolesService,
    private readonly storesService: StoresService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  // 1. 권한 요청
  async create({
    userId,
    createRoleRequestInput,
  }: IRoleRequestsServiceCreate): Promise<RoleRequest> {
    const { roleName } = createRoleRequestInput;

    // 1. 권한 확인
    const role = await this.rolesService.findOneByName({ name: roleName });
    if (!role) throw new NotFoundException('존재하지 않는 권한입니다.');

    // 2. 중복 확인
    const existingRequest = await this.roleRequestRepository.findOne({
      where: { userId, status: RoleRequestStatus.PENDING },
    });
    if (existingRequest)
      throw new ConflictException('이미 처리 대기 중인 권한 요청이 있습니다.');

    // 3. 생성
    const request = this.roleRequestRepository.create({
      userId,
      roleId: role.id,
      status: RoleRequestStatus.PENDING,
    });

    const savedRequest = await this.roleRequestRepository.save(request);
    savedRequest.role = role;
    const user = await this.usersService.findOne(userId);
    if (user) savedRequest.user = user;

    return savedRequest;
  }

  // 2. 전체 조회
  async findAll(): Promise<RoleRequest[]> {
    return await this.roleRequestRepository.find({
      relations: ['user', 'role', 'processedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  // 3. 요청 처리
  async process({
    adminId,
    processRoleRequestInput,
  }: IRoleRequestsServiceProcess): Promise<RoleRequest> {
    const { requestId, status, storeId } = processRoleRequestInput;

    if (status === RoleRequestStatus.PENDING) {
      throw new BadRequestException(
        '승인(APPROVED) 또는 거절(REJECTED)만 가능합니다.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const request = await queryRunner.manager.findOne(RoleRequest, {
        where: { id: requestId },
        relations: ['user', 'role'],
      });

      if (!request) throw new NotFoundException('요청을 찾을 수 없습니다.');
      if (request.status !== RoleRequestStatus.PENDING)
        throw new ConflictException('이미 처리된 요청입니다.');

      // 상태 업데이트
      request.status = status;
      request.processedById = adminId;

      const result = await queryRunner.manager.save(request);

      // 승인 시 로직
      if (status === RoleRequestStatus.APPROVED) {
        const user = await queryRunner.manager.findOne(User, {
          where: { id: request.userId },
        });

        if (user) {
          user.roleId = request.roleId;
          user.role = request.role;
          if (storeId) {
            // 매장 확인 (검증 로직 추가 가능)
            const store = await this.storesService.findOne(storeId);
            user.storeId = storeId;
            user.store = store;
          }
          await queryRunner.manager.save(user);
        }
        const updatedUser = await queryRunner.manager.findOne(User, {
          where: { id: request.userId },
          relations: ['role', 'store'],
        });

        if (updatedUser) result.user = updatedUser;

        const adminUser = await queryRunner.manager.findOne(User, {
          where: { id: adminId },
        });
        if (adminUser) result.processedBy = adminUser;
      }

      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
