import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IStoreServiceCheckCode,
  IStoreServiceCreate,
  IStoreServiceUpdate,
} from './interfaces/stores-service.interface';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>, //
  ) {}

  async findOneByCode({ code }: IStoreServiceCheckCode): Promise<Store | null> {
    return await this.storeRepository.findOne({ where: { code } });
  }

  async findOne(id: number): Promise<Store | null> {
    return await this.storeRepository.findOne({ where: { id } });
  }
  async findAll(user: User): Promise<Store[]> {
    const options: FindManyOptions<Store> = {
      order: { createdAt: 'DESC' },
    };

    if (user.role.name !== 'ADMIN') {
      options.select = {
        id: true,
        name: true,
        address: true,
      };
    }

    // 조회 실행
    return await this.storeRepository.find(options);
  }

  async findMyStore(user: User, storeId?: number): Promise<Store> {
    const options: FindOneOptions<Store> = {};

    let targetStoreId = storeId;

    if (user.role.name === 'ADMIN') {
      if (!targetStoreId) {
        throw new BadRequestException(
          '관리자는 조회할 매장 ID를 입력해야 합니다.',
        );
      }
    } else {
      // USER, STAFF
      if (!user.storeId) {
        throw new BadRequestException('소속된 매장이 없습니다.');
      }
      targetStoreId = user.storeId;

      //  일반 직원은 민감 정보 숨김 (Field Masking)
      options.select = {
        id: true,
        name: true,
        address: true,
        telePhoneNumber: true,
        isActive: true,
        createdAt: true,
      };
    }

    options.where = { id: targetStoreId };

    const store = await this.storeRepository.findOne(options);
    if (!store) throw new NotFoundException('매장을 찾을 수 없습니다.');

    return store;
  }

  async create({ createStoreInput }: IStoreServiceCreate): Promise<Store> {
    const result = this.storeRepository.create({
      ...createStoreInput,
      code: uuidv4(),
      isActive: true,
    });

    return await this.storeRepository.save(result);
  }

  async update({
    user,
    updateStoreInput,
  }: IStoreServiceUpdate): Promise<Store> {
    const { id, code, ...rest } = updateStoreInput;

    let targetStoreId = id;

    if (user.role.name !== 'ADMIN') {
      // STAFF인데 소속 매장이 없다? -> 수정 권한 없음 (에러!)
      if (!user.storeId) {
        throw new UnauthorizedException(
          '소속된 매장이 없어 매장 정보를 수정할 수 없습니다.',
        );
      }
      // 입력된 id를 무시하고 본인 매장으로 강제 고정
      targetStoreId = user.storeId;
    }

    // 매장 조회
    const store = await this.storeRepository.findOne({
      where: { id: targetStoreId },
    });
    if (!store) throw new NotFoundException('매장이 존재하지 않습니다.');

    // 지점 코드 변경 (ADMIN만 가능)
    if (code && code !== store.code) {
      if (user.role.name !== 'ADMIN') {
        throw new ForbiddenException(
          '지점 코드는 관리자만 변경할 수 있습니다.',
        );
      }
      const isExist = await this.findOneByCode({ code });
      if (isExist) {
        throw new ConflictException(`지점 코드(${code})는 이미 사용 중입니다.`);
      }
      store.code = code;
    }

    // 나머지 정보 업데이트
    Object.assign(store, rest);

    return await this.storeRepository.save(store);
  }

  async delete(id: number): Promise<boolean> {
    const store = await this.storeRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!store) throw new NotFoundException('매장을 찾을수 없습니다.');

    if (store.deletedAt) throw new ConflictException('이미 삭제된 매장입니다.');

    const result = await this.storeRepository.softDelete({ id });
    return result.affected ? true : false;
  }
}
