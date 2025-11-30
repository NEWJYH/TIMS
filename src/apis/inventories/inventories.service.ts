import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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

@Injectable()
export class InventoriesService implements OnModuleInit {
  // 캐싱
  private inTypeId: number;
  private outTypeId: number;
  private adjustTypeId: number;

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

  async onModuleInit() {
    const inType = await this.typeRepository.findOne({ where: { name: 'IN' } });
    const outType = await this.typeRepository.findOne({
      where: { name: 'OUT' },
    });
    const adjustType = await this.typeRepository.findOne({
      where: { name: 'ADJUST' },
    });

    if (inType && outType && adjustType) {
      this.inTypeId = inType.id;
      this.outTypeId = outType.id;
      this.adjustTypeId = adjustType.id;
    } else {
      console.log('seed 실행필요');
    }
    return;
  }

  async stockIn(input: StockInInput): Promise<Inventory> {
    const { storeId, tireId, quantity, userId, memo } = input;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 매장/타이어 존재 검증
      const store = await this.storesService.findOne(storeId);
      const tire = await this.tiresService.findOne(tireId);
      if (!store || !tire)
        throw new NotFoundException('매장 또는 타이어 정보가 없습니다.');

      // 2. 재고 조회 (없으면 생성해야 함)
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
        userId,
        typeId: this.inTypeId,
        quantityChange: quantity,
        currentQuantity: inventory.quantity,
        memo,
      });
      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();

      history.type = {
        id: this.inTypeId,
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

  // =================================================================
  // 2. 재고 출고 (STOCK OUT)
  // =================================================================
  async stockOut(input: StockOutInput): Promise<Inventory> {
    const { storeId, tireId, quantity, userId, memo } = input;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inventory = await queryRunner.manager.findOne(Inventory, {
        where: { storeId, tireId },

        relations: ['tire', 'store'],
      });

      if (!inventory) {
        throw new NotFoundException('출고할 재고 데이터가 없습니다.');
      }

      // 재고 부족 체크
      // quantity가 양수(정상 출고)일 때만 체크. 음수(출고 취소/반품)면 체크 불필요
      if (quantity > 0 && inventory.quantity < quantity) {
        throw new BadRequestException(
          `재고가 부족합니다. (현재: ${inventory.quantity}, 요청: ${quantity})`,
        );
      }

      // 수량 변경 (출고: -)
      // input.quantity가 5면 -> inventory.quantity - 5
      // input.quantity가 -5면(정정) -> inventory.quantity - (-5) = +5 (복구됨)
      inventory.quantity -= quantity;
      await queryRunner.manager.save(inventory);

      // 이력 기록
      const history = this.historyRepository.create({
        inventoryId: inventory.id,
        userId,
        typeId: this.outTypeId,
        quantityChange: -quantity,
        currentQuantity: inventory.quantity,
        memo,
      });
      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();

      inventory.histories = [history];
      return inventory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async stockAdjust(input: StockAdjustInput): Promise<Inventory> {
    const { storeId, tireId, quantity, userId, memo } = input;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 재고 조회 (비관적 락)
      let inventory = await queryRunner.manager.findOne(Inventory, {
        where: { storeId, tireId },
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
        userId,
        typeId: this.adjustTypeId,
        quantityChange: quantity,
        currentQuantity: inventory.quantity,
        memo,
      });
      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();
      history.type = {
        id: this.adjustTypeId,
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

  async findAllByStore(storeId: number): Promise<Inventory[]> {
    return await this.inventoriesRepository.find({
      where: { storeId },
      relations: ['tire', 'tire.brand', 'tire.category'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(storeId: number, tireId: number): Promise<Inventory | null> {
    return await this.inventoriesRepository.findOne({
      where: { storeId, tireId },
      relations: ['tire'],
    });
  }
}
