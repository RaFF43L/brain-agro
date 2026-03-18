import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farm } from './entities/farm.entity';
import { ProducersService } from '../producers/producers.service';
import { HandleErrorsClass } from '../../common/decorators/handle-errors-class.decorator';
import { CustomError } from '../../common/errors/custom-error';
import {
  CursorPaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';

@Injectable()
@HandleErrorsClass({ rethrow: true })
export class FarmsService {
  private readonly sortableFields = ['id', 'name', 'city', 'state', 'totalArea', 'createdAt'];

  constructor(
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    private readonly producersService: ProducersService,
  ) {}

  async create(dto: {
    name: string;
    city: string;
    state: string;
    totalArea: number;
    arableArea: number;
    vegetationArea: number;
    producerId: number;
  }): Promise<Farm> {
    await this.producersService.findOne(dto.producerId);

    if (dto.arableArea + dto.vegetationArea > dto.totalArea) {
      throw new CustomError(
        'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const farm = Object.assign(new Farm(), dto);
    return this.farmRepository.save(farm);
  }

  async findByProducer(
    producerId: number,
    query: CursorPaginationQueryDto,
  ): Promise<PaginatedResult<Farm>> {
    const { page = 1, limit = 10, cursor, search, sortBy, sortOrder = 'ASC' } = query;

    const field = this.sortableFields.includes(sortBy ?? '') ? sortBy! : 'id';

    const qb = this.farmRepository
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.crops', 'crop')
      .where('farm.producerId = :producerId', { producerId })
      .orderBy(`farm.${field}`, sortOrder);

    if (search) {
      qb.andWhere(
        '(farm.name ILIKE :search OR farm.city ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (cursor) {
      qb.andWhere('farm.id > :cursor', { cursor });
    }

    qb.take(limit);

    if (!cursor) {
      qb.skip((page - 1) * limit);
    }

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    const lastItem = data[data.length - 1];

    return {
      data,
      meta: {
        total,
        page: cursor ? 0 : page,
        limit,
        totalPages,
        hasNext: cursor ? data.length === limit : page < totalPages,
        nextCursor: lastItem?.id ?? null,
      },
    };
  }

  async update(
    id: number,
    dto: Partial<{
      name: string;
      city: string;
      state: string;
      totalArea: number;
      arableArea: number;
      vegetationArea: number;
    }>,
  ): Promise<Farm> {
    const farm = await this.findOne(id);

    const totalArea = dto.totalArea ?? farm.totalArea;
    const arableArea = dto.arableArea ?? farm.arableArea;
    const vegetationArea = dto.vegetationArea ?? farm.vegetationArea;

    if (arableArea + vegetationArea > totalArea) {
      throw new CustomError(
        'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    Object.assign(farm, dto);
    return this.farmRepository.save(farm);
  }

  async remove(id: number): Promise<void> {
    const farm = await this.findOne(id);
    await this.farmRepository.remove(farm);
  }

  async findOne(id: number): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: { id },
      relations: ['producer', 'crops'],
    });

    if (!farm) {
      throw new CustomError(
        `Farm with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return farm;
  }
}
