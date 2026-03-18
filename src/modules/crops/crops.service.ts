import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Crop } from './entities/crop.entity';
import { FarmsService } from '../farms/farms.service';
import { HandleErrorsClass } from '../../common/decorators/handle-errors-class.decorator';
import { CustomError } from '../../common/errors/custom-error';
import {
  CursorPaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';

@Injectable()
@HandleErrorsClass({ rethrow: true })
export class CropsService {
  private readonly sortableFields = ['id', 'season', 'culture', 'createdAt'];

  constructor(
    @InjectRepository(Crop)
    private readonly cropRepository: Repository<Crop>,
    private readonly farmsService: FarmsService,
  ) {}

  async create(dto: { season: string; culture: string; farmId: number }): Promise<Crop> {
    await this.farmsService.findOne(dto.farmId);
    const crop = Object.assign(new Crop(), dto);
    return this.cropRepository.save(crop);
  }

  async findByFarm(
    farmId: number,
    query: CursorPaginationQueryDto,
  ): Promise<PaginatedResult<Crop>> {
    const { page = 1, limit = 10, cursor, search, sortBy, sortOrder = 'ASC' } = query;

    const field = this.sortableFields.includes(sortBy ?? '') ? sortBy! : 'id';

    const qb = this.cropRepository
      .createQueryBuilder('crop')
      .where('crop.farmId = :farmId', { farmId })
      .orderBy(`crop.${field}`, sortOrder);

    if (search) {
      qb.andWhere(
        '(crop.season ILIKE :search OR crop.culture ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (cursor) {
      qb.andWhere('crop.id > :cursor', { cursor });
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
    dto: Partial<{ season: string; culture: string }>,
  ): Promise<Crop> {
    const crop = await this.findOne(id);
    Object.assign(crop, dto);
    return this.cropRepository.save(crop);
  }

  async remove(id: number): Promise<void> {
    const crop = await this.findOne(id);
    await this.cropRepository.remove(crop);
  }

  async findOne(id: number): Promise<Crop> {
    const crop = await this.cropRepository.findOne({
      where: { id },
      relations: ['farm'],
    });

    if (!crop) {
      throw new CustomError(
        `Crop with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return crop;
  }
}
