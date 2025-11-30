import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Tire } from './entities/tire.entity';
import { TireBrandsService } from '../tireBrands/tireBrands.service';
import { TireCategoriesService } from '../tireCatetories/tireCategories.service';
import {
  ITiresServiceCreate,
  ITiresServiceUpdate,
} from './interfaces/tires-service.interface';

@Injectable()
export class TiresService {
  constructor(
    @InjectRepository(Tire)
    private readonly tiresRepository: Repository<Tire>,
    private readonly tireBrandsService: TireBrandsService,
    private readonly tireCategoriesService: TireCategoriesService,
  ) {}

  async create({ createTireInput }: ITiresServiceCreate): Promise<Tire> {
    // 1. ID와 나머지 데이터 분리
    const { brandId, categoryId, ...tireData } = createTireInput;

    // 2. 브랜드 & 카테고리 검증
    const brand = await this.tireBrandsService.findOne(brandId);
    if (!brand) throw new BadRequestException('존재하지 않는 브랜드입니다.');

    const category = await this.tireCategoriesService.findOne(categoryId);
    if (!category)
      throw new BadRequestException('존재하지 않는 카테고리입니다.');

    // 3. 중복 확인 (이미 있는 규격인지?)
    const existingTire = await this.tiresRepository.findOne({
      where: {
        brandId,
        name: tireData.name,
        width: tireData.width,
        diameter: tireData.diameter,
        aspectRatio: tireData.aspectRatio ? tireData.aspectRatio : IsNull(),
        plyRating: tireData.plyRating ? tireData.plyRating : IsNull(),
      },
    });

    if (existingTire)
      throw new ConflictException(
        `이미 등록된 타이어입니다. (ID: ${existingTire.id})`,
      );

    const result = this.tiresRepository.create({
      ...tireData, // name, width, diameter, plyRating
      brand,
      category,
    });

    return await this.tiresRepository.save(result);
  }

  async findAll(): Promise<Tire[]> {
    return await this.tiresRepository.find();
  }

  async findOne(id: number): Promise<Tire | null> {
    return await this.tiresRepository.findOne({ where: { id } });
  }

  async update({ updateTireInput }: ITiresServiceUpdate): Promise<Tire> {
    const { id, brandId, categoryId, ...rest } = updateTireInput;

    const tire = await this.findOne(id);
    if (!tire) throw new NotFoundException('타이어를 찾을 수 없습니다.');

    // 1. 브랜드 변경 시 검증
    if (brandId) {
      const brand = await this.tireBrandsService.findOne(brandId);
      if (!brand) throw new BadRequestException('잘못된 브랜드 ID입니다.');
      tire.brand = brand;
      tire.brandId = brandId;
    }

    // 2. 카테고리 변경 시 검증
    if (categoryId) {
      const category = await this.tireCategoriesService.findOne(categoryId);
      if (!category) throw new BadRequestException('잘못된 카테고리 ID입니다.');
      tire.category = category;
      tire.categoryId = categoryId;
    }

    // 수정 시 중복 스펙 검사
    const newSpec = {
      name: rest.name ?? tire.name,
      width: rest.width ?? tire.width,
      aspectRatio: rest.aspectRatio ?? tire.aspectRatio,
      diameter: rest.diameter ?? tire.diameter,
      plyRating: rest.plyRating !== undefined ? rest.plyRating : tire.plyRating,
      brandId: brandId ?? tire.brandId,
    };

    const existingTire = await this.tiresRepository.findOne({
      where: {
        id: Not(id),
        brandId: newSpec.brandId,
        name: newSpec.name,
        width: newSpec.width,
        diameter: newSpec.diameter,
        aspectRatio: newSpec.aspectRatio ? newSpec.aspectRatio : IsNull(),
        plyRating: newSpec.plyRating ? newSpec.plyRating : IsNull(),
      },
    });

    if (existingTire)
      throw new ConflictException('이미 존재하는 타이어 스펙입니다.');

    // 4. 나머지 필드 업데이트
    Object.assign(tire, rest);

    return await this.tiresRepository.save(tire);
  }

  async delete(id: number): Promise<boolean> {
    const tire = await this.tiresRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!tire) throw new NotFoundException('타이어를 찾을수 없습니다.');

    if (tire.deletedAt)
      throw new ConflictException('이미 삭제된 타이어 입니다.');

    const result = await this.tiresRepository.softDelete({ id });
    return result.affected ? true : false;
  }
}
