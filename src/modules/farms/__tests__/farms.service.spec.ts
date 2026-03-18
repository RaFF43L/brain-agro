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
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('FarmsService', () => {
  let service: FarmsService;
  let farmRepository: MockRepository<Farm>;
  let producersService: Partial<Record<keyof ProducersService, jest.Mock>>;

  beforeEach(async () => {
    producersService = {
      findOne: jest.fn(),
    };

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
      const producer = { id: 1, cpfCnpj: '12345678901', name: 'João Silva' } as Producer;
      const expected = { id: 1, ...dto, producer, crops: [], createdAt: new Date(), updatedAt: new Date() };

      producersService.findOne!.mockResolvedValue(producer);
      farmRepository.create!.mockReturnValue(expected);
      farmRepository.save!.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(producersService.findOne).toHaveBeenCalledWith(dto.producerId);
      expect(farmRepository.create).toHaveBeenCalledWith(dto);
      expect(farmRepository.save).toHaveBeenCalledWith(expected);
      expect(result).toEqual(expected);
      expect(result.producerId).toBe(producer.id);
    });

    it('should throw if producer does not exist', async () => {
      producersService.findOne!.mockRejectedValue(new Error('Producer with id 999 not found'));

      await expect(
        service.create({ ...dto, producerId: 999 }),
      ).rejects.toThrow('Producer with id 999 not found');
    });
  });

  describe('findOne', () => {
    it('should return a farm by id', async () => {
      const expected = { id: 1, name: 'Fazenda Boa Vista', crops: [] } as unknown as Farm;

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

  describe('findAll', () => {
    it('should return all farms', async () => {
      const expected = [{ id: 1, name: 'Fazenda Boa Vista' }] as unknown as Farm[];

      farmRepository.find!.mockResolvedValue(expected);

      const result = await service.findAll();

      expect(farmRepository.find).toHaveBeenCalledWith({ relations: ['producer', 'crops'] });
      expect(result).toEqual(expected);
    });
  });
});
