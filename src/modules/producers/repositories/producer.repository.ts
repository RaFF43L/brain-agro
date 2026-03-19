import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producer } from '../entities/producer.entity';
import { PaginatedResult, PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { offsetPaginate } from '../../../common/pagination/offset-paginate';

@Injectable()
export class ProducerRepository {
  private readonly sortableFields = ['id', 'name', 'cpfCnpj', 'createdAt'];

  constructor(
    @InjectRepository(Producer)
    private readonly repo: Repository<Producer>,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Producer>> {
    const { page = 1, limit = 10, search, sortBy, sortOrder = 'ASC' } = query;

    const field = this.sortableFields.includes(sortBy ?? '') ? sortBy! : 'id';

    const qb = this.repo
      .createQueryBuilder('producer')
      .leftJoinAndSelect('producer.farms', 'farm')
      .leftJoinAndSelect('farm.crops', 'crop')
      .orderBy(`producer.${field}`, sortOrder);

    if (search) {
      qb.andWhere(
        '(producer.name ILIKE :search OR producer.cpfCnpj ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return offsetPaginate(qb, page, limit);
  }

  async findOne(id: number): Promise<Producer | null> {
    return this.repo.findOne({ where: { id } });
  }

  async save(producer: Producer): Promise<Producer> {
    return this.repo.save(producer);
  }

  async remove(producer: Producer): Promise<void> {
    await this.repo.remove(producer);
  }
}
