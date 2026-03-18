import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProducersService } from '../producers.service';
import { Producer } from '../entities/producer.entity';
import { Farm } from '../entities/farm.entity';
import { Crop } from '../entities/crop.entity';

type MockRepository<T = any> = Partial<
  Record<keyof Repository<any>, jest.Mock>
>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('ProducersService', () => {
  let service: ProducersService;
  let producerRepository: MockRepository<Producer>;
  let farmRepository: MockRepository<Farm>;
  let cropRepository: MockRepository<Crop>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducersService,
        {
          provide: getRepositoryToken(Producer),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Farm),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Crop),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ProducersService>(ProducersService);
    producerRepository = module.get(getRepositoryToken(Producer));
    farmRepository = module.get(getRepositoryToken(Farm));
    cropRepository = module.get(getRepositoryToken(Crop));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProducer', () => {
    it('should create a producer', async () => {
      const dto = { cpfCnpj: '12345678901', name: 'João Silva' };
      const expected = { id: 1, ...dto, farms: [], createdAt: new Date(), updatedAt: new Date() };

      producerRepository.create!.mockReturnValue(expected);
      producerRepository.save!.mockResolvedValue(expected);

      const result = await service.createProducer(dto);

      expect(producerRepository.create).toHaveBeenCalledWith(dto);
      expect(producerRepository.save).toHaveBeenCalledWith(expected);
      expect(result).toEqual(expected);
    });
  });

  describe('createFarm', () => {
    it('should create a farm associated to a producer', async () => {
      const producer = { id: 1, cpfCnpj: '12345678901', name: 'João Silva' } as Producer;
      const dto = {
        name: 'Fazenda Boa Vista',
        city: 'Ribeirão Preto',
        state: 'SP',
        totalArea: 1000,
        arableArea: 600,
        vegetationArea: 400,
        producerId: 1,
      };
      const expected = { id: 1, ...dto, producer, crops: [], createdAt: new Date(), updatedAt: new Date() };

      producerRepository.findOne!.mockResolvedValue(producer);
      farmRepository.create!.mockReturnValue(expected);
      farmRepository.save!.mockResolvedValue(expected);

      const result = await service.createFarm(dto);

      expect(producerRepository.findOne).toHaveBeenCalledWith({ where: { id: dto.producerId } });
      expect(farmRepository.create).toHaveBeenCalledWith(dto);
      expect(farmRepository.save).toHaveBeenCalledWith(expected);
      expect(result).toEqual(expected);
      expect(result.producerId).toBe(producer.id);
    });

    it('should throw if producer does not exist', async () => {
      const dto = {
        name: 'Fazenda Fantasma',
        city: 'Lugar Nenhum',
        state: 'XX',
        totalArea: 100,
        arableArea: 50,
        vegetationArea: 50,
        producerId: 999,
      };

      producerRepository.findOne!.mockResolvedValue(null);

      await expect(service.createFarm(dto)).rejects.toThrow('Producer with id 999 not found');
    });
  });

  describe('createCrop', () => {
    it('should create a crop associated to a farm', async () => {
      const farm = { id: 1, name: 'Fazenda Boa Vista' } as Farm;
      const dto = {
        season: 'Safra 2021',
        culture: 'Soja',
        farmId: 1,
      };
      const expected = { id: 1, ...dto, farm, createdAt: new Date(), updatedAt: new Date() };

      farmRepository.findOne!.mockResolvedValue(farm);
      cropRepository.create!.mockReturnValue(expected);
      cropRepository.save!.mockResolvedValue(expected);

      const result = await service.createCrop(dto);

      expect(farmRepository.findOne).toHaveBeenCalledWith({ where: { id: dto.farmId } });
      expect(cropRepository.create).toHaveBeenCalledWith(dto);
      expect(cropRepository.save).toHaveBeenCalledWith(expected);
      expect(result).toEqual(expected);
      expect(result.farmId).toBe(farm.id);
    });

    it('should throw if farm does not exist', async () => {
      const dto = {
        season: 'Safra 2021',
        culture: 'Milho',
        farmId: 999,
      };

      farmRepository.findOne!.mockResolvedValue(null);

      await expect(service.createCrop(dto)).rejects.toThrow('Farm with id 999 not found');
    });
  });
});
