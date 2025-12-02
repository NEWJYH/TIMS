import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';

import { StoresService } from '../stores/stores.service';
import { TiresService } from '../tires/tires.service';
import { InventoryHistory } from '../inventoryHistory/entities/inventoryHistory.entity';
import { InventoryHistoryType } from '../inventoryHistoryTypes/entities/inventoryHistoryType.entity';
import {
  StockAdjustInput,
  StockInInput,
  StockOutInput,
} from './dto/stock-transaction.input';
import { User } from '../users/entities/user.entity';

@Injectable()
export class InventoriesService {
  // 캐싱용 객체 (초기값 null)
  private typeIds: Record<string, number | null> = {
    IN: null,
    OUT: null,
    ADJUST: null,
  };

  constructor(
    @InjectRepository(Inventory)
    private readonly inventoriesRepository: Repository<Inventory>,
    @InjectRepository(InventoryHistory)
    private readonly historyRepository: Repository<InventoryHistory>,
    @InjectRepository(InventoryHistoryType)
    private readonly typeRepository: Repository<InventoryHistoryType>,
    private readonly dataSource: DataSource,
    private readonly storesService: StoresService,
    private readonly tiresService: TiresService,
  ) {}

  private async getTypeId(name: 'IN' | 'OUT' | 'ADJUST'): Promise<number> {
    if (this.typeIds[name]) return this.typeIds[name]; // 캐시 있으면 리턴

    const type = await this.typeRepository.findOne({ where: { name } });
    if (!type) {
      throw new InternalServerErrorException(
        `[System] '${name}' 타입 데이터가 없습니다. 'npm run seed'를 실행하세요.`,
      );
    }
    this.typeIds[name] = type.id; // 캐싱
    return type.id;
  }

  private getTargetStoreId(user: User, inputStoreId?: number): number {
    // 관리자(ADMIN)인 경우
    if (user.role.name === 'ADMIN') {
      // 입력한 storeId가 있으면 그걸 쓰고, 없으면 본인 소속 매장(있다면)을 씀
      if (inputStoreId) return inputStoreId;
      if (user.storeId) return user.storeId;
      throw new BadRequestException(
        '관리자는 작업할 매장 ID(storeId)를 입력해야 합니다.',
      );
    }

    // 일반 직원(USER, STAFF)인 경우
    // 입력값 무시하고 무조건 본인 소속 매장으로 강제함 (보안)
    if (!user.storeId) {
      throw new BadRequestException(
        '소속된 매장이 없습니다. 매장 배정 후 이용해주세요.',
      );
    }
    return user.storeId;
  }

  async stockIn(user: User, stockInInput: StockInInput): Promise<Inventory> {
    const typeId = await this.getTypeId('IN');

    const { tireId, quantity, memo } = stockInInput;

    const storeId = this.getTargetStoreId(user, stockInInput.storeId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 매장/타이어 존재 검증
      const store = await this.storesService.findOne(storeId);
      const tire = await this.tiresService.findOne(tireId);
      if (!store || !tire)
        throw new NotFoundException('매장 또는 타이어 정보가 없습니다.');

      // 재고 조회
      let inventory = await queryRunner.manager.findOne(Inventory, {
        where: { storeId, tireId },
      });

      if (!inventory) {
        // 신규 재고 생성
        inventory = this.inventoriesRepository.create({
          storeId,
          tireId,
          quantity: 0,
        });
        inventory = await queryRunner.manager.save(inventory);
      }

      // 3. 수량 변경 (입고: +)
      inventory.quantity += quantity;
      await queryRunner.manager.save(inventory);

      // 이력 기록
      const history = this.historyRepository.create({
        inventoryId: inventory.id,
        userId: user.id,
        typeId: typeId,
        quantityChange: quantity,
        currentQuantity: inventory.quantity,
        memo,
      });
      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();

      history.type = {
        id: typeId,
        name: 'IN',
      } as InventoryHistoryType;

      // 객체 조립
      inventory.tire = tire;
      inventory.store = store;
      inventory.histories = [history];
      return inventory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async stockOut(user: User, stockOutInput: StockOutInput): Promise<Inventory> {
    const typeId = await this.getTypeId('OUT');

    const { tireId, quantity, memo } = stockOutInput;

    const storeId = this.getTargetStoreId(user, stockOutInput.storeId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inventory = await queryRunner.manager.findOne(Inventory, {
        where: { storeId, tireId },
        relations: ['tire', 'store'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!inventory) {
        throw new NotFoundException('출고할 재고 데이터가 없습니다.');
      }

      // 재고 부족 체크
      if (quantity > 0 && inventory.quantity < quantity) {
        throw new BadRequestException(
          `재고가 부족합니다. (현재: ${inventory.quantity}, 요청: ${quantity})`,
        );
      }

      // 수량 변경 (출고: -)
      inventory.quantity -= quantity;
      await queryRunner.manager.save(inventory);

      // 이력 기록
      const history = this.historyRepository.create({
        inventoryId: inventory.id,
        userId: user.id,
        typeId: typeId,
        quantityChange: -quantity,
        currentQuantity: inventory.quantity,
        memo,
      });
      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();
      history.type = { id: typeId, name: 'OUT' } as InventoryHistoryType;
      inventory.histories = [history];
      return inventory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async stockAdjust(
    user: User,
    stockAdjustInput: StockAdjustInput,
  ): Promise<Inventory> {
    const typeId = await this.getTypeId('ADJUST');

    const { tireId, quantity, memo } = stockAdjustInput;

    const storeId = this.getTargetStoreId(user, stockAdjustInput.storeId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 재고 조회
      let inventory = await queryRunner.manager.findOne(Inventory, {
        where: { storeId, tireId },
        relations: ['tire', 'store'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!inventory && quantity < 0) {
        throw new NotFoundException('조정할 재고 데이터가 없습니다.');
      }

      // 신규 생성
      if (!inventory) {
        inventory = this.inventoriesRepository.create({
          storeId,
          tireId,
          quantity: 0,
        });
        inventory = await queryRunner.manager.save(inventory);
      }

      // 4. 재고 부족 체크
      if (inventory.quantity + quantity < 0) {
        throw new BadRequestException(
          `재고가 부족하여 조정할 수 없습니다. (현재: ${inventory.quantity}, 요청변동: ${quantity})`,
        );
      }

      // 수량 변경
      inventory.quantity += quantity;
      await queryRunner.manager.save(inventory);

      // 이력 기록
      const history = this.historyRepository.create({
        inventoryId: inventory.id,
        userId: user.id,
        typeId: typeId,
        quantityChange: quantity,
        currentQuantity: inventory.quantity,
        memo,
      });
      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();
      history.type = {
        id: typeId,
        name: 'ADJUST',
      } as InventoryHistoryType;

      inventory.histories = [history];
      return inventory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(user: User, storeId?: number): Promise<Inventory[]> {
    const where: FindOptionsWhere<Inventory> = {};

    if (user.role.name === 'ADMIN') {
      // ADMIN
      if (storeId) {
        where.storeId = storeId;
      }
    } else {
      // USER, STAFF
      if (!user.storeId) {
        throw new BadRequestException(
          '소속된 매장이 없어 재고를 조회할 수 없습니다.',
        );
      }
      where.storeId = user.storeId;
    }

    return await this.inventoriesRepository.find({
      where,
      relations: ['tire', 'tire.brand', 'tire.category', 'store'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(
    user: User,
    tireId: number,
    storeId?: number,
  ): Promise<Inventory | null> {
    const where: FindOptionsWhere<Inventory> = {};
    where.tireId = tireId;

    if (user.role.name === 'ADMIN') {
      // ADMIN
      if (storeId) {
        where.storeId = storeId;
      }
    } else {
      // USER, STAFF
      if (!user.storeId) {
        throw new BadRequestException(
          '소속된 매장이 없어 재고를 조회할 수 없습니다.',
        );
      }
      where.storeId = user.storeId;
    }

    return await this.inventoriesRepository.findOne({
      where,
      relations: ['tire', 'tire.brand', 'tire.category', 'store'],
    });
  }
}
