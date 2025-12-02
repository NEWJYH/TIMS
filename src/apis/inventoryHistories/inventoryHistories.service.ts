import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  FindOptionsWhere,
} from 'typeorm';
import { InventoryHistory } from './entities/inventoryHistory.entity';
import { IInventoryHistoriesServiceFindAll } from './interfaces/inventoryHistories-service.interface';
import { FetchInventoryHistoryOutput } from './dto/fetch-inventoryHistory.output';
import { Inventory } from '../inventories/entities/inventory.entity';

@Injectable()
export class InventoryHistoriesService {
  constructor(
    @InjectRepository(InventoryHistory)
    private readonly historyRepository: Repository<InventoryHistory>,
  ) {}

  async findAll({
    user,
    fetchInventoryHistoryInput,
  }: IInventoryHistoriesServiceFindAll): Promise<FetchInventoryHistoryOutput> {
    const { page, limit, storeId, tireId, startDate, endDate } =
      fetchInventoryHistoryInput;

    // 검색 조건(Where) 초기화
    const where: FindOptionsWhere<InventoryHistory> = {};

    const inventoryWhere: FindOptionsWhere<Inventory> = {};

    // 매장(Store) 필터링 - 권한 분기
    if (user.role.name === 'ADMIN') {
      // [ADMIN] 입력된 storeId가 있으면 필터링
      if (storeId) {
        inventoryWhere.storeId = storeId;
      }
    } else {
      // [USER/STAFF] 본인 매장 강제 필터링
      if (!user.storeId) {
        throw new BadRequestException('소속된 매장이 없습니다.');
      }
      inventoryWhere.storeId = user.storeId;
    }
    // 타이어(Tire) 필터링
    if (tireId) {
      inventoryWhere.tireId = tireId;
    }

    // 조건이 하나라도 있을 때만 할당
    if (Object.keys(inventoryWhere).length > 0) {
      where.inventory = inventoryWhere;
    }

    // 날짜(Date) 필터링 (createdAt 기준)
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }

    // 조회 및 반환 (Pagination)
    const [items, count] = await this.historyRepository.findAndCount({
      where,
      relations: [
        'inventory',
        'inventory.tire',
        'inventory.tire.brand', // 브랜드명 표시용
        'inventory.store', // 매장명 표시용
        'user', // 작업자 이름 표시용
        'type', // 변동 타입(IN/OUT) 표시용
      ],
      order: { createdAt: 'DESC' }, // 최신순 정렬
      take: limit,
      skip: (page - 1) * limit,
    });

    return { items, count };
  }
}
