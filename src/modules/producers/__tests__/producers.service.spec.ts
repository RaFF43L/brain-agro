import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getLoggerToken } from 'nestjs-pino';
import { ProducersService } from '../producers.service';
import { Producer } from '../entities/producer.entity';

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

type MockRepository<T = any> = Partial<
  Record<keyof Repository<any>, jest.Mock>
>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const createMockQueryBuilder = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('ProducersService', () => {
  let service: ProducersService;
  let producerRepository: MockRepository<Producer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducersService,
        { provide: getLoggerToken(ProducersService.name), useValue: mockLogger },
        {
          provide: getRepositoryToken(Producer),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ProducersService>(ProducersService);
    producerRepository = module.get(getRepositoryToken(Producer));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a producer with Object.assign', async () => {
      const dto = { cpfCnpj: '12345678901', name: 'João Silva' };
      const saved = { id: 1, ...dto };

      producerRepository.save!.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(producerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(dto),
      );
      expect(result).toEqual(saved);
    });
  });

  describe('createFull', () => {
    it('should create producer with farms and crops via cascade', async () => {
      const dto = {
        cpfCnpj: '52998224725',
        name: 'João Silva',
        farms: [
          {
            name: 'Fazenda Boa Vista',
            city: 'Ribeirão Preto',
            state: 'SP',
            totalArea: 1000,
            arableArea: 600,
            vegetationArea: 400,
            crops: [
              { season: 'Safra 2021', culture: 'Soja' },
              { season: 'Safra 2021', culture: 'Milho' },
            ],
          },
        ],
      };

      const fullProducer = {
        id: 1,
        cpfCnpj: dto.cpfCnpj,
        name: dto.name,
        farms: [{ id: 1, name: 'Fazenda Boa Vista', crops: [{ id: 1, season: 'Safra 2021', culture: 'Soja' }, { id: 2, season: 'Safra 2021', culture: 'Milho' }] }],
      };

      producerRepository.save!.mockResolvedValue(fullProducer);

      const result = await service.createFull(dto);

      expect(producerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cpfCnpj: dto.cpfCnpj,
          name: dto.name,
          farms: expect.arrayContaining([
            expect.objectContaining({ name: 'Fazenda Boa Vista' }),
          ]),
        }),
      );
      expect(result).toEqual(fullProducer);
    });

    it('should create producer without farms', async () => {
      const dto = { cpfCnpj: '52998224725', name: 'Maria Santos' };
      const savedProducer = { id: 2, ...dto, farms: [] };

      producerRepository.save!.mockResolvedValue(savedProducer);

      const result = await service.createFull(dto);

      expect(producerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ cpfCnpj: dto.cpfCnpj, name: dto.name, farms: [] }),
      );
      expect(result.farms).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return paginated producers with offset', async () => {
      const producers = [{ id: 1, name: 'João Silva' }] as unknown as Producer[];
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([producers, 1]);
      producerRepository.createQueryBuilder!.mockReturnValue(mockQb);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(10);
      expect(mockQb.orderBy).toHaveBeenCalledWith('producer.id', 'ASC');
      expect(result.data).toEqual(producers);
      expect(result.meta.total).toBe(1);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta).not.toHaveProperty('nextCursor');
    });

    it('should sort by allowed field', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      producerRepository.createQueryBuilder!.mockReturnValue(mockQb);

      await service.findAll({ page: 1, limit: 10, sortBy: 'name', sortOrder: 'DESC' });

      expect(mockQb.orderBy).toHaveBeenCalledWith('producer.name', 'DESC');
    });

    it('should fallback to id when sortBy is invalid', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      producerRepository.createQueryBuilder!.mockReturnValue(mockQb);

      await service.findAll({ page: 1, limit: 10, sortBy: 'invalid' });

      expect(mockQb.orderBy).toHaveBeenCalledWith('producer.id', 'ASC');
    });

    it('should filter by search', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      producerRepository.createQueryBuilder!.mockReturnValue(mockQb);

      await service.findAll({ page: 1, limit: 10, search: 'João' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(producer.name ILIKE :search OR producer.cpfCnpj ILIKE :search)',
        { search: '%João%' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a producer by id', async () => {
      const expected = { id: 1, cpfCnpj: '12345678901', name: 'João Silva' } as unknown as Producer;
      producerRepository.findOne!.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(producerRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(expected);
    });

    it('should throw if producer does not exist', async () => {
      producerRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow('Producer with id 999 not found');
    });
  });

  describe('update', () => {
    it('should update a producer', async () => {
      const existing = { id: 1, cpfCnpj: '12345678901', name: 'João Silva' } as unknown as Producer;
      const updated = { ...existing, name: 'João Souza' } as unknown as Producer;

      producerRepository.findOne!.mockResolvedValue(existing);
      producerRepository.save!.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'João Souza' });

      expect(result.name).toBe('João Souza');
    });

    it('should throw if producer does not exist', async () => {
      producerRepository.findOne!.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Ninguém' })).rejects.toThrow('Producer with id 999 not found');
    });
  });

  describe('remove', () => {
    it('should remove a producer', async () => {
      const existing = { id: 1 } as unknown as Producer;
      producerRepository.findOne!.mockResolvedValue(existing);
      producerRepository.remove!.mockResolvedValue(existing);

      await service.remove(1);

      expect(producerRepository.remove).toHaveBeenCalledWith(existing);
    });

    it('should throw if producer does not exist', async () => {
      producerRepository.findOne!.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow('Producer with id 999 not found');
    });
  });
});
