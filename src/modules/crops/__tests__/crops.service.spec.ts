import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getLoggerToken } from 'nestjs-pino';
import { CropsService } from '../crops.service';
import { Crop } from '../entities/crop.entity';

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
import { FarmsService } from '../../farms/farms.service';
import { Farm } from '../../farms/entities/farm.entity';

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
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

describe('CropsService', () => {
  let service: CropsService;
  let cropRepository: MockRepository<Crop>;
  let farmsService: Partial<Record<keyof FarmsService, jest.Mock>>;

  beforeEach(async () => {
    farmsService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CropsService,
        { provide: getLoggerToken(CropsService.name), useValue: mockLogger },
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
    const dto = { season: 'Safra 2021', culture: 'Soja', farmId: 1 };

    it('should create a crop associated to a farm', async () => {
      const farm = { id: 1 } as Farm;
      const saved = { id: 1, ...dto };

      farmsService.findOne!.mockResolvedValue(farm);
      cropRepository.save!.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(farmsService.findOne).toHaveBeenCalledWith(dto.farmId);
      expect(cropRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ season: dto.season, culture: dto.culture }),
      );
      expect(result).toEqual(saved);
    });

    it('should throw if farm does not exist', async () => {
      farmsService.findOne!.mockRejectedValue(new Error('Farm with id 999 not found'));

      await expect(service.create({ ...dto, farmId: 999 })).rejects.toThrow(
        'Farm with id 999 not found',
      );
    });
  });

  describe('findByFarm', () => {
    it('should return paginated crops with offset', async () => {
      const crops = [{ id: 1, season: 'Safra 2021', culture: 'Soja' }] as unknown as Crop[];
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([crops, 1]);
      cropRepository.createQueryBuilder!.mockReturnValue(mockQb);

      const result = await service.findByFarm(1, { page: 1, limit: 10 });

      expect(mockQb.where).toHaveBeenCalledWith('crop.farmId = :farmId', { farmId: 1 });
      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(result.data).toEqual(crops);
      expect(result.meta.total).toBe(1);
    });

    it('should return crops with cursor pagination', async () => {
      const crops = [{ id: 11, season: 'Safra 2022', culture: 'Milho' }] as unknown as Crop[];
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([crops, 50]);
      cropRepository.createQueryBuilder!.mockReturnValue(mockQb);

      const result = await service.findByFarm(1, { cursor: 10, limit: 1 });

      expect(mockQb.andWhere).toHaveBeenCalledWith('crop.id > :cursor', { cursor: 10 });
      expect(result.meta.nextCursor).toBe(11);
      expect(result.meta.hasNext).toBe(true);
    });

    it('should filter crops by search', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      cropRepository.createQueryBuilder!.mockReturnValue(mockQb);

      await service.findByFarm(1, { page: 1, limit: 10, search: 'Soja' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(crop.season ILIKE :search OR crop.culture ILIKE :search)',
        { search: '%Soja%' },
      );
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
});
