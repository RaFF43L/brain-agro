import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { ProducersService } from '../producers.service';
import { ProducerRepository } from '../repositories/producer.repository';
import { Producer } from '../entities/producer.entity';

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const createMockProducerRepository = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('ProducersService', () => {
  let service: ProducersService;
  let producerRepository: ReturnType<typeof createMockProducerRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducersService,
        { provide: getLoggerToken(ProducersService.name), useValue: mockLogger },
        { provide: ProducerRepository, useValue: createMockProducerRepository() },
      ],
    }).compile();

    service = module.get<ProducersService>(ProducersService);
    producerRepository = module.get(ProducerRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a producer with Object.assign', async () => {
      const dto = { cpfCnpj: '12345678901', name: 'João Silva' };
      const saved = { id: 1, ...dto };

      producerRepository.save.mockResolvedValue(saved);

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
        farms: [{ id: 1, name: 'Fazenda Boa Vista', crops: [{ id: 1 }, { id: 2 }] }],
      };

      producerRepository.save.mockResolvedValue(fullProducer);

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

      producerRepository.save.mockResolvedValue(savedProducer);

      const result = await service.createFull(dto);

      expect(producerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ cpfCnpj: dto.cpfCnpj, name: dto.name, farms: [] }),
      );
      expect(result.farms).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should delegate to producerRepository.findAll', async () => {
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false } };
      producerRepository.findAll.mockResolvedValue(expected);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(producerRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a producer by id', async () => {
      const expected = { id: 1, cpfCnpj: '12345678901', name: 'João Silva' } as unknown as Producer;
      producerRepository.findOne.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(producerRepository.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });

    it('should throw if producer does not exist', async () => {
      producerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow('Producer with id 999 not found');
    });
  });

  describe('update', () => {
    it('should update a producer', async () => {
      const existing = { id: 1, cpfCnpj: '12345678901', name: 'João Silva' } as unknown as Producer;
      const updated = { ...existing, name: 'João Souza' } as unknown as Producer;

      producerRepository.findOne.mockResolvedValue(existing);
      producerRepository.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'João Souza' });

      expect(result.name).toBe('João Souza');
    });

    it('should throw if producer does not exist', async () => {
      producerRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Ninguém' })).rejects.toThrow('Producer with id 999 not found');
    });
  });

  describe('remove', () => {
    it('should remove a producer', async () => {
      const existing = { id: 1 } as unknown as Producer;
      producerRepository.findOne.mockResolvedValue(existing);
      producerRepository.remove.mockResolvedValue(undefined);

      await service.remove(1);

      expect(producerRepository.remove).toHaveBeenCalledWith(existing);
    });

    it('should throw if producer does not exist', async () => {
      producerRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow('Producer with id 999 not found');
    });
  });
});
