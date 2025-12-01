import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { RolesService } from '../roles/roles.service';
import { StoresService } from '../stores/stores.service';
import { RoleRequest } from './entities/roleRequest.entity';
import {
  IRoleRequestsServiceCreate,
  IRoleRequestsServiceFindAll,
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

  // 권한 요청
  async create({
    userId,
    createRoleRequestInput,
  }: IRoleRequestsServiceCreate): Promise<RoleRequest> {
    const { roleName, storeId } = createRoleRequestInput;

    // 1. 권한 확인
    const role = await this.rolesService.findOneByName({ name: roleName });
    if (!role) throw new NotFoundException('존재하지 않는 권한입니다.');

    // 2. 매장 확인
    const store = await this.storesService.findOne(storeId);
    if (!store) throw new NotFoundException('존재하지 않는 매장입니다.');

    // 3. 중복 확인
    const existingRequest = await this.roleRequestRepository.findOne({
      where: {
        userId, //
        status: RoleRequestStatus.PENDING,
        roleId: role.id,
      },
    });
    if (existingRequest)
      throw new ConflictException('이미 처리 대기 중인 권한 요청이 있습니다.');

    // 4. 생성
    const request = this.roleRequestRepository.create({
      userId,
      roleId: role.id,
      storeId: store.id,
      status: RoleRequestStatus.PENDING,
    });

    const savedRequest = await this.roleRequestRepository.save(request);
    savedRequest.role = role;
    savedRequest.store = store;

    const user = await this.usersService.findOne(userId);
    if (user) savedRequest.user = user;

    return savedRequest;
  }

  async findAll({
    user,
    status,
  }: IRoleRequestsServiceFindAll): Promise<RoleRequest[]> {
    // 1. 기본 검색 조건 (Where) 설정
    const where: FindOptionsWhere<RoleRequest> = {};

    // 2. 상태 필터가 들어왔다면 적용 (예: PENDING)
    if (status) {
      where.status = status;
    }

    // 3. [권한 분기] 점장(STAFF)은 '자기 매장' 요청만 봐야 함
    if (user.role.name === 'STAFF') {
      if (!user.storeId) {
        throw new BadRequestException(
          '소속된 매장이 없는 점장은 조회할 수 없습니다.',
        );
      }
      // 내 매장 ID로 필터링 강제 적용
      where.storeId = user.storeId;
    }

    return await this.roleRequestRepository.find({
      where,
      relations: ['user', 'role', 'store', 'processedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  // 요청 처리
  async process({
    approverId,
    processRoleRequestInput,
  }: IRoleRequestsServiceProcess): Promise<RoleRequest> {
    const { requestId, status } = processRoleRequestInput;

    if (status === RoleRequestStatus.PENDING) {
      throw new BadRequestException(
        '승인(APPROVED) 또는 거절(REJECTED)만 가능합니다.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 요청 내역 조회 (희망 매장 정보 포함)
      const request = await queryRunner.manager.findOne(RoleRequest, {
        where: { id: requestId },
        relations: ['user', 'role', 'store'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!request) throw new NotFoundException('요청을 찾을 수 없습니다.');
      if (request.status !== RoleRequestStatus.PENDING)
        throw new ConflictException('이미 처리된 요청입니다.');

      // 2. 승인자(Approver) 정보 조회 (권한 및 소속 매장 확인용)
      const approver = await queryRunner.manager.findOne(User, {
        where: { id: approverId },
        relations: ['role', 'store'],
      });
      if (!approver) throw new NotFoundException('승인자를 찾을수 없습니다.');

      const targetRole = request.role.name; // 되고 싶은 것
      const approverRole = approver.role.name; // 승인하는 사람

      if (targetRole === 'STAFF') {
        if (approverRole !== 'ADMIN') {
          throw new ForbiddenException(
            '점장(STAFF) 승인 권한은 관리자(ADMIN)에게만 있습니다.',
          );
        }
      } else if (targetRole === 'USER') {
        if (approverRole === 'ADMIN') {
          // 통과 (관리자는 프리패스)
        } else if (approverRole === 'STAFF') {
          // 점장은 "자기 매장" 요청만 승인 가능
          if (approver.storeId !== request.storeId) {
            throw new ForbiddenException(
              '본인 매장의 직원 요청만 승인할 수 있습니다.',
            );
          }
        } else {
          // 일반 유저는 승인 권한 없음
          throw new ForbiddenException('승인 권한이 없습니다.');
        }
      }

      // 상태 업데이트
      request.status = status;
      request.processedById = approverId;

      const result = await queryRunner.manager.save(request);

      // 승인 시 로직
      if (status === RoleRequestStatus.APPROVED) {
        const user = await queryRunner.manager.findOne(User, {
          where: { id: request.userId },
        });

        if (user) {
          user.role = request.role;
          user.roleId = request.roleId;
          user.store = request.store;
          user.storeId = request.storeId;

          await queryRunner.manager.save(user);
        }
        const updatedUser = await queryRunner.manager.findOne(User, {
          where: { id: request.userId },
          relations: ['role', 'store'],
        });

        if (updatedUser) result.user = updatedUser;
      }
      result.processedBy = approver;

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
