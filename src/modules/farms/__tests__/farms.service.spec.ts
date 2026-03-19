import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FarmsService } from '../farms.service';
import { Farm } from '../entities/farm.entity';
import { ProducersService } from '../../producers/producers.service';
import { Producer } from '../../producers/entities/producer.entity';

type MockRepository<T = any> = Partial<
  Record<keyof Repository<any>, jest.Mock>
>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const createMockQueryBuilder = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('FarmsService', () => {
  let service: FarmsService;
  let farmRepository: MockRepository<Farm>;
  let producersService: Partial<Record<keyof ProducersService, jest.Mock>>;

  beforeEach(async () => {
    producersService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmsService,
        {
          provide: getRepositoryToken(Farm),
          useValue: createMockRepository(),
        },
        {
          provide: ProducersService,
          useValue: producersService,
        },
      ],
    }).compile();

    service = module.get<FarmsService>(FarmsService);
    farmRepository = module.get(getRepositoryToken(Farm));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      name: 'Fazenda Boa Vista',
      city: 'Ribeirão Preto',
      state: 'SP',
      totalArea: 1000,
      arableArea: 600,
      vegetationArea: 400,
      producerId: 1,
    };

    it('should create a farm associated to a producer', async () => {
      const producer = { id: 1 } as Producer;
      const saved = { id: 1, ...dto };

      producersService.findOne!.mockResolvedValue(producer);
      farmRepository.save!.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(producersService.findOne).toHaveBeenCalledWith(dto.producerId);
      expect(farmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: dto.name, producerId: dto.producerId }),
      );
      expect(result).toEqual(saved);
    });

    it('should throw if producer does not exist', async () => {
      producersService.findOne!.mockRejectedValue(new Error('Producer with id 999 not found'));

      await expect(service.create({ ...dto, producerId: 999 })).rejects.toThrow(
        'Producer with id 999 not found',
      );
    });

    it('should throw if arableArea + vegetationArea exceeds totalArea', async () => {
      producersService.findOne!.mockResolvedValue({ id: 1 });

      await expect(
        service.create({ ...dto, arableArea: 700, vegetationArea: 400, totalArea: 1000 }),
      ).rejects.toThrow(
        'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda',
      );

      expect(farmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const existing = {
      id: 1,
      name: 'Fazenda Boa Vista',
      city: 'Ribeirão Preto',
      state: 'SP',
      totalArea: 1000,
      arableArea: 600,
      vegetationArea: 400,
      producerId: 1,
    } as unknown as Farm;

    it('should update a farm', async () => {
      const updated = { ...existing, name: 'Fazenda Nova' };
      farmRepository.findOne!.mockResolvedValue(existing);
      farmRepository.save!.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'Fazenda Nova' });

      expect(farmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Fazenda Nova' }),
      );
      expect(result.name).toBe('Fazenda Nova');
    });

    it('should throw if farm does not exist', async () => {
      farmRepository.findOne!.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X' })).rejects.toThrow(
        'Farm with id 999 not found',
      );
    });

    it('should throw if arableArea + vegetationArea exceeds totalArea after update', async () => {
      farmRepository.findOne!.mockResolvedValue(existing);

      await expect(
        service.update(1, { arableArea: 800 }),
      ).rejects.toThrow(
        'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda',
      );

      expect(farmRepository.save).not.toHaveBeenCalled();
    });

    it('should throw if new totalArea is less than existing sum', async () => {
      farmRepository.findOne!.mockResolvedValue(existing);

      await expect(
        service.update(1, { totalArea: 500 }),
      ).rejects.toThrow(
        'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda',
      );

      expect(farmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByProducer', () => {
    it('should return paginated farms with offset', async () => {
      const farms = [{ id: 1, name: 'Fazenda Boa Vista' }] as unknown as Farm[];
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([farms, 1]);
      farmRepository.createQueryBuilder!.mockReturnValue(mockQb);

      const result = await service.findByProducer(1, { page: 1, limit: 10 });

      expect(mockQb.where).toHaveBeenCalledWith('farm.producerId = :producerId', { producerId: 1 });
      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(result.data).toEqual(farms);
      expect(result.meta.total).toBe(1);
    });

    it('should return farms with cursor pagination', async () => {
      const farms = [{ id: 6, name: 'Fazenda Nova' }] as unknown as Farm[];
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([farms, 20]);
      farmRepository.createQueryBuilder!.mockReturnValue(mockQb);

      const result = await service.findByProducer(1, { cursor: 5, limit: 1 });

      expect(mockQb.andWhere).toHaveBeenCalledWith('farm.id > :cursor', { cursor: 5 });
      expect(result.meta.nextCursor).toBe(6);
      expect(result.meta.hasNext).toBe(true);
    });

    it('should filter farms by search', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      farmRepository.createQueryBuilder!.mockReturnValue(mockQb);

      await service.findByProducer(1, { page: 1, limit: 10, search: 'Boa' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(farm.name ILIKE :search OR farm.city ILIKE :search)',
        { search: '%Boa%' },
      );
    });
  });

    describe('findUnassigned', () => {
    it('should return paginated farms with offset', async () => {
      const farms = [{ id: 1, name: 'Fazenda Boa Vista' }] as unknown as Farm[];
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([farms, 1]);
      farmRepository.createQueryBuilder!.mockReturnValue(mockQb);

      const result = await service.findUnassigned({ page: 1, limit: 10 });

      expect(mockQb.where).toHaveBeenCalledWith('farm.producerId = :producerId', { producerId: 1 });
      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(result.data).toEqual(farms);
      expect(result.meta.total).toBe(1);
    });

    it('should return farms with cursor pagination', async () => {
      const farms = [{ id: 6, name: 'Fazenda Nova' }] as unknown as Farm[];
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([farms, 20]);
      farmRepository.createQueryBuilder!.mockReturnValue(mockQb);

      const result = await service.findByProducer(1, { cursor: 5, limit: 1 });

      expect(mockQb.andWhere).toHaveBeenCalledWith('farm.id > :cursor', { cursor: 5 });
      expect(result.meta.nextCursor).toBe(6);
      expect(result.meta.hasNext).toBe(true);
    });

    it('should filter farms by search', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      farmRepository.createQueryBuilder!.mockReturnValue(mockQb);

      await service.findByProducer(1, { page: 1, limit: 10, search: 'Boa' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(farm.name ILIKE :search OR farm.city ILIKE :search)',
        { search: '%Boa%' },
      );
    });
  });


  describe('findOne', () => {
    it('should return a farm by id', async () => {
      const expected = { id: 1, name: 'Fazenda Boa Vista' } as unknown as Farm;
      farmRepository.findOne!.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(farmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['producer', 'crops'],
      });
      expect(result).toEqual(expected);
    });

    it('should throw if farm does not exist', async () => {
      farmRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow('Farm with id 999 not found');
    });
  });
});
