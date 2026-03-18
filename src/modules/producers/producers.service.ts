import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producer } from './entities/producer.entity';
import { HandleErrorsClass } from '../../common/decorators/handle-errors-class.decorator';
import { CustomError } from '../../common/errors/custom-error';

@Injectable()
@HandleErrorsClass({ rethrow: true })
export class ProducersService {
  constructor(
    @InjectRepository(Producer)
    private readonly producerRepository: Repository<Producer>,
  ) {}

  async create(dto: { cpfCnpj: string; name: string }): Promise<Producer> {
    const producer = this.producerRepository.create(dto);
    return this.producerRepository.save(producer);
  }

  async findAll() {
    return this.producerRepository.find({ relations: ['farms'] });
  }

  async findOne(id: number) {
    const producer = await this.producerRepository.findOne({
      where: { id },
      relations: ['farms'],
    });

    if (!producer) {
      throw new CustomError(
        `Producer with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return producer;
  }

  async update(id: number, dto: Partial<{ cpfCnpj: string; name: string }>): Promise<Producer> {
    const producer = await this.findOne(id);
    Object.assign(producer, dto);
    return this.producerRepository.save(producer);
  }

  async remove(id: number): Promise<void> {
    const producer = await this.findOne(id);
    await this.producerRepository.remove(producer);
  }
}
