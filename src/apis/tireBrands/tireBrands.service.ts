import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TireBrand } from './entities/tireBrand.entity';
import {
  ITireBrandServiceCreate,
  ITireBrandServiceUpdate,
} from './interfaces/tireBrands-service.interface';

@Injectable()
export class TireBrandsService {
  constructor(
    @InjectRepository(TireBrand)
    private readonly tireBrandsRepository: Repository<TireBrand>,
  ) {}

  async findAll(): Promise<TireBrand[]> {
    return await this.tireBrandsRepository.find();
  }

  async findOne(id: number): Promise<TireBrand> {
    const tireBrand = await this.tireBrandsRepository.findOne({
      where: { id },
    });

    if (!tireBrand) {
      throw new NotFoundException(
        '존재하지 않는 타이어브랜드Id(TireBrandId)입니다.',
      );
    }

    return tireBrand;
  }

  async create({
    createTireBrandInput,
  }: ITireBrandServiceCreate): Promise<TireBrand> {
    const { name } = createTireBrandInput;

    const isExist = await this.tireBrandsRepository.findOne({
      where: { name },
    });
    if (isExist) {
      throw new ConflictException('이미 등록된 타이어 브랜드입니다.');
    }

    return await this.tireBrandsRepository.save({ name });
  }

  async update({
    updateTireBrandInput,
  }: ITireBrandServiceUpdate): Promise<TireBrand> {
    const { id, name } = updateTireBrandInput;

    const brand = await this.tireBrandsRepository.findOne({ where: { id } });
    if (!brand) {
      throw new NotFoundException(`ID가 ${id}인 브랜드를 찾을 수 없습니다.`);
    }

    // 이름 변경 시 중복 체크
    if (name && name !== brand.name) {
      const isExist = await this.tireBrandsRepository.findOne({
        where: { name },
      });
      if (isExist) {
        throw new ConflictException(`${name} 브랜드는 이미 존재합니다.`);
      }
      brand.name = name;
    }

    return await this.tireBrandsRepository.save(brand);
  }
}
