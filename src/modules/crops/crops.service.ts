import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Crop } from './entities/crop.entity';
import { FarmsService } from '../farms/farms.service';
import { HandleErrorsClass } from '../../common/decorators/handle-errors-class.decorator';
import { CustomError } from '../../common/errors/custom-error';

@Injectable()
@HandleErrorsClass({ rethrow: true })
export class CropsService {
  constructor(
    @InjectRepository(Crop)
    private readonly cropRepository: Repository<Crop>,
    private readonly farmsService: FarmsService,
  ) {}

  async create(dto: { season: string; culture: string; farmId: number }) {
    await this.farmsService.findOne(dto.farmId);
    const crop = this.cropRepository.create(dto);
    return this.cropRepository.save(crop);
  }

  async findAll() {
    return this.cropRepository.find({ relations: ['farm'] });
  }

  async findOne(id: number) {
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
