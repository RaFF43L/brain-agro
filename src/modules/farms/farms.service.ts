import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Farm } from './entities/farm.entity';
import { HandleErrorsClass } from '../../common/decorators/handle-errors-class.decorator';
import { CustomError } from '../../common/errors/custom-error';
import {
  CursorPaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { FilterDateDto } from './dto/filter-farm.dto';
import { FarmRepository } from './repositories/farm.repository';

@Injectable()
@HandleErrorsClass({ rethrow: true })
export class FarmsService {
  constructor(
    @InjectPinoLogger(FarmsService.name)
    private readonly logger: PinoLogger,
    private readonly farmRepository: FarmRepository,
  ) {}

  async create(dto: {
    name: string;
    city: string;
    state: string;
    totalArea: number;
    arableArea: number;
    vegetationArea: number;
    producerId?: number;
  }): Promise<Farm> {
    if (dto.arableArea + dto.vegetationArea > dto.totalArea) {
      throw new CustomError(
        'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    try {
      const farm = Object.assign(new Farm(), dto);
      return await this.farmRepository.save(farm);
    } catch (error: any) {
      if (error?.code === '23503') {
        throw new CustomError('Producer not found', HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  async findByProducer(
    producerId: number,
    query: CursorPaginationQueryDto,
  ): Promise<PaginatedResult<Farm>> {
    return this.farmRepository.findByProducer(producerId, query);
  }

  async findUnassigned(
    query: CursorPaginationQueryDto,
  ): Promise<PaginatedResult<Farm>> {
    return this.farmRepository.findUnassigned(query);
  }

  async getDashboard(filter: FilterDateDto) {
    return this.farmRepository.getDashboard(filter);
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

    const totalArea = Number(dto.totalArea ?? farm.totalArea);
    const arableArea = Number(dto.arableArea ?? farm.arableArea);
    const vegetationArea = Number(dto.vegetationArea ?? farm.vegetationArea);

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
    const farm = await this.farmRepository.findOne(id);

    if (!farm) {
      throw new CustomError(
        `Farm with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return farm;
  }
}
