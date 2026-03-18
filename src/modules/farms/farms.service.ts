import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farm } from './entities/farm.entity';
import { ProducersService } from '../producers/producers.service';
import { HandleErrorsClass } from '../../common/decorators/handle-errors-class.decorator';
import { CustomError } from '../../common/errors/custom-error';

@Injectable()
@HandleErrorsClass({ rethrow: true })
export class FarmsService {
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
  }) {
    await this.producersService.findOne(dto.producerId);
    const farm = this.farmRepository.create(dto);
    return this.farmRepository.save(farm);
  }

  async findAll() {
    return this.farmRepository.find({ relations: ['producer', 'crops'] });
  }

  async findOne(id: number) {
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
