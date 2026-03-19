import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producer } from './entities/producer.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Crop } from '../crops/entities/crop.entity';
import { HandleErrorsClass } from '../../common/decorators/handle-errors-class.decorator';
import { CustomError } from '../../common/errors/custom-error';
import { CreateProducerFullDto } from './dto/create-producer-full.dto';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';

@Injectable()
@HandleErrorsClass({ rethrow: true })
export class ProducersService {
  private readonly sortableFields = ['id', 'name', 'cpfCnpj', 'createdAt'];

  constructor(
    @InjectRepository(Producer)
    private readonly producerRepository: Repository<Producer>,
  ) {}

  async create(dto: { cpfCnpj: string; name: string }): Promise<Producer> {
    const producer = Object.assign(new Producer(), dto);
    return this.producerRepository.save(producer);
  }

  async createFull(dto: CreateProducerFullDto): Promise<Producer> {
    const producer = Object.assign(new Producer(), {
      cpfCnpj: dto.cpfCnpj,
      name: dto.name,
      farms: dto.farms?.map((farmInput) =>
        Object.assign(new Farm(), {
          name: farmInput.name,
          city: farmInput.city,
          state: farmInput.state,
          totalArea: farmInput.totalArea,
          arableArea: farmInput.arableArea,
          vegetationArea: farmInput.vegetationArea,
          crops: farmInput.crops?.map((cropInput) =>
            Object.assign(new Crop(), {
              season: cropInput.season,
              culture: cropInput.culture,
            }),
          ) ?? [],
        }),
      ) ?? [],
    });

    return this.producerRepository.save(producer);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Producer>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder = 'ASC' } = query;

    const field = this.sortableFields.includes(sortBy ?? '') ? sortBy! : 'id';

    const qb = this.producerRepository
      .createQueryBuilder('producer')
      .orderBy(`producer.${field}`, sortOrder);

    if (search) {
      qb.andWhere(
        '(producer.name ILIKE :search OR producer.cpfCnpj ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
      },
    };
  }

  async findOne(id: number): Promise<Producer> {
    const producer = await this.producerRepository.findOne({
      where: { id }
    });

    if (!producer) {
      throw new CustomError(
        `Producer with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return producer;
  }

  async update(
    id: number,
    dto: Partial<{ cpfCnpj: string; name: string }>,
  ): Promise<Producer> {
    const producer = await this.findOne(id);
    Object.assign(producer, dto);
    return this.producerRepository.save(producer);
  }

  async remove(id: number): Promise<void> {
    const producer = await this.findOne(id);
    await this.producerRepository.remove(producer);
  }
}
