import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CropsService } from '../crops.service';
import { Crop } from '../entities/crop.entity';
import { FarmsService } from '../../farms/farms.service';
import { Farm } from '../../farms/entities/farm.entity';

type MockRepository<T = any> = Partial<
  Record<keyof Repository<any>, jest.Mock>
>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('CropsService', () => {
  let service: CropsService;
  let cropRepository: MockRepository<Crop>;
  let farmsService: Partial<Record<keyof FarmsService, jest.Mock>>;

  beforeEach(async () => {
    farmsService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CropsService,
        {
          provide: getRepositoryToken(Crop),
          useValue: createMockRepository(),
        },
        {
          provide: FarmsService,
          useValue: farmsService,
        },
      ],
    }).compile();

    service = module.get<CropsService>(CropsService);
    cropRepository = module.get(getRepositoryToken(Crop));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      season: 'Safra 2021',
      culture: 'Soja',
      farmId: 1,
    };

    it('should create a crop associated to a farm', async () => {
      const farm = { id: 1, name: 'Fazenda Boa Vista' } as Farm;
      const expected = { id: 1, ...dto, farm, createdAt: new Date(), updatedAt: new Date() };

      farmsService.findOne!.mockResolvedValue(farm);
      cropRepository.create!.mockReturnValue(expected);
      cropRepository.save!.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(farmsService.findOne).toHaveBeenCalledWith(dto.farmId);
      expect(cropRepository.create).toHaveBeenCalledWith(dto);
      expect(cropRepository.save).toHaveBeenCalledWith(expected);
      expect(result).toEqual(expected);
      expect(result.farmId).toBe(farm.id);
    });

    it('should throw if farm does not exist', async () => {
      farmsService.findOne!.mockRejectedValue(new Error('Farm with id 999 not found'));

      await expect(
        service.create({ ...dto, farmId: 999 }),
      ).rejects.toThrow('Farm with id 999 not found');
    });
  });

  describe('findOne', () => {
    it('should return a crop by id', async () => {
      const expected = { id: 1, season: 'Safra 2021', culture: 'Soja' } as unknown as Crop;

      cropRepository.findOne!.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(cropRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['farm'],
      });
      expect(result).toEqual(expected);
    });

    it('should throw if crop does not exist', async () => {
      cropRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow('Crop with id 999 not found');
    });
  });

  describe('findAll', () => {
    it('should return all crops', async () => {
      const expected = [{ id: 1, season: 'Safra 2021', culture: 'Soja' }] as unknown as Crop[];

      cropRepository.find!.mockResolvedValue(expected);

      const result = await service.findAll();

      expect(cropRepository.find).toHaveBeenCalledWith({ relations: ['farm'] });
      expect(result).toEqual(expected);
    });
  });
});
