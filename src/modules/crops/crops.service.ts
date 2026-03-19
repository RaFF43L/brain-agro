import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Crop } from './entities/crop.entity';
import { HandleErrorsClass } from '../../common/decorators/handle-errors-class.decorator';
import { CustomError } from '../../common/errors/custom-error';
import {
  CursorPaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { CropRepository } from './repositories/crop.repository';

@Injectable()
@HandleErrorsClass({ rethrow: true })
export class CropsService {
  constructor(
    @InjectPinoLogger(CropsService.name)
    private readonly logger: PinoLogger,
    private readonly cropRepository: CropRepository,
  ) {}

  async create(dto: { season: string; culture: string }): Promise<Crop> {
    const crop = Object.assign(new Crop(), dto);
    return this.cropRepository.save(crop);
  }

  async findByFarm(
    farmId: number,
    query: CursorPaginationQueryDto,
  ): Promise<PaginatedResult<Crop>> {
    return this.cropRepository.findByFarm(farmId, query);
  }

  async findUnassigned(
    query: CursorPaginationQueryDto,
  ): Promise<PaginatedResult<Crop>> {
    return this.cropRepository.findUnassigned(query);
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
    const crop = await this.cropRepository.findOne(id);

    if (!crop) {
      throw new CustomError(
        `Crop with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return crop;
  }
}
