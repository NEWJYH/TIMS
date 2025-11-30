import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IStoreServiceCheckCode,
  IStoreServiceCreate,
  IStoreServiceUpdate,
} from './interfaces/stores-service.interface';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>, //
  ) {}

  async findOneByCode({ code }: IStoreServiceCheckCode): Promise<Store | null> {
    return await this.storeRepository.findOne({ where: { code } });
  }

  async create({ createStoreInput }: IStoreServiceCreate): Promise<Store> {
    const { code, ...rest } = createStoreInput;
    // TODO : 전화 번호 검증

    // 지점 코드 중복 체크
    const isExist = await this.findOneByCode({ code });
    if (isExist) {
      throw new ConflictException(`지점 코드(${code})는 이미 사용 중입니다.`);
    }

    const result = this.storeRepository.create({
      code,
      ...rest,
      isActive: true,
    });

    return await this.storeRepository.save(result);
  }

  async findAll(): Promise<Store[]> {
    return await this.storeRepository.find();
  }

  async findOne(id: number): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException(`ID가 ${id}인 매장을 찾을 수 없습니다.`);
    }
    return store;
  }

  async update({ updateStoreInput }: IStoreServiceUpdate): Promise<Store> {
    const { id, code, ...rest } = updateStoreInput;

    // 1. 수정할 매장이 있는지 확인
    const store = await this.findOne(id);

    // 2. 코드를 수정한다면 중복 체크 (기존 코드와 다를 때만)
    if (code && code !== store.code) {
      const isExist = await this.findOneByCode({ code });
      if (isExist) {
        throw new ConflictException(`지점 코드(${code})는 이미 사용 중입니다.`);
      }
      store.code = code;
    }

    // 3. 나머지 필드 업데이트 및 저장
    const updatedStore = {
      ...store,
      ...rest,
    };

    return await this.storeRepository.save(updatedStore);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.storeRepository.softDelete({ id });
    return result.affected ? true : false;
  }
}
