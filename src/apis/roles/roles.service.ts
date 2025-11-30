import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IRoleServiceCreate,
  IRoleServiceFindByName,
  IRoleServiceUpdate,
} from './interfaces/roles-service.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>, //
  ) {}

  async findOneByName({ name }: IRoleServiceFindByName): Promise<Role | null> {
    return await this.roleRepository.findOne({
      where: { name },
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`ID가 ${id}인 권한을 찾을 수 없습니다.`);
    }
    return role;
  }

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find();
  }

  async create({ createRoleInput }: IRoleServiceCreate): Promise<Role> {
    const { name } = createRoleInput;

    const isExist = await this.findOneByName({ name });
    if (isExist) throw new ConflictException(`${name} 권한은 이미 존재합니다.`);

    return await this.roleRepository.save({ name });
  }

  async update({ updateRoleInput }: IRoleServiceUpdate): Promise<Role> {
    const { id, name } = updateRoleInput;

    const role = await this.findOne(id);

    if (name && name !== role.name) {
      const isExist = await this.findOneByName({ name });
      if (isExist) {
        throw new ConflictException(`${name} 이름은 이미 사용 중입니다.`);
      }
      role.name = name; // 객체 업데이트
    }

    return await this.roleRepository.save(role);
  }
}
