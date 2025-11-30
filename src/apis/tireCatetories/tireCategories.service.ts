import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TireCategory } from './entities/tireCategory.entity';
import { Repository } from 'typeorm';
import {
  ITireCategoriesServiceCreate,
  ITireCategoriesServiceUpdate,
} from './interfaces/tireCategories-service.interface';

@Injectable()
export class TireCategoriesService {
  constructor(
    @InjectRepository(TireCategory)
    private readonly tireCategoriesRepository: Repository<TireCategory>, //
  ) {}

  async findAll(): Promise<TireCategory[]> {
    return await this.tireCategoriesRepository.find();
  }

  async findOne(id: number): Promise<TireCategory> {
    const tireCategory = await this.tireCategoriesRepository.findOne({
      where: { id },
    });

    if (!tireCategory) {
      throw new NotFoundException(
        '존재하지 않는 타이어카테고리Id(TireCategoryId)입니다.',
      );
    }

    return tireCategory;
  }

  async create({
    createTireCategoryInput,
  }: ITireCategoriesServiceCreate): Promise<TireCategory> {
    const { name } = createTireCategoryInput;

    const isExistName = await this.tireCategoriesRepository.findOne({
      where: { name },
    });
    if (isExistName) {
      throw new ConflictException('이미 등록된 타이어 카테고리 이름입니다.');
    }
    return await this.tireCategoriesRepository.save({ name });
  }
  //

  async update({
    updateTireCategoryInput,
  }: ITireCategoriesServiceUpdate): Promise<TireCategory> {
    const { id, name } = updateTireCategoryInput;
    const tireCategory = await this.tireCategoriesRepository.findOne({
      where: { id },
    });

    if (!tireCategory) {
      throw new NotFoundException(
        `ID가 ${id}인 타이어 카테고리를 찾을 수 없습니다.`,
      );
    }

    if (name && name !== tireCategory.name) {
      const isEixstName = await this.tireCategoriesRepository.findOne({
        where: { name },
      });

      if (isEixstName) {
        throw new ConflictException(`${name} 카테고리는 이미 존재합니다.`);
      }
      tireCategory.name = name;
    }

    return await this.tireCategoriesRepository.save(tireCategory);
  }
}
