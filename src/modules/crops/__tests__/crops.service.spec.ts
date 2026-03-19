import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { CropsService } from '../crops.service';
import { CropRepository } from '../repositories/crop.repository';
import { Crop } from '../entities/crop.entity';

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const createMockCropRepository = () => ({
  findByFarm: jest.fn(),
  findUnassigned: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('CropsService', () => {
  let service: CropsService;
  let cropRepository: ReturnType<typeof createMockCropRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CropsService,
        { provide: getLoggerToken(CropsService.name), useValue: mockLogger },
        { provide: CropRepository, useValue: createMockCropRepository() },
      ],
    }).compile();

    service = module.get<CropsService>(CropsService);
    cropRepository = module.get(CropRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a crop', async () => {
      const dto = { season: 'Safra 2021', culture: 'Soja' };
      const saved = { id: 1, ...dto };

      cropRepository.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(cropRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ season: dto.season, culture: dto.culture }),
      );
      expect(result).toEqual(saved);
    });
  });

  describe('findByFarm', () => {
    it('should delegate to cropRepository.findByFarm', async () => {
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, nextCursor: null } };
      cropRepository.findByFarm.mockResolvedValue(expected);

      const result = await service.findByFarm(1, { page: 1, limit: 10 });

      expect(cropRepository.findByFarm).toHaveBeenCalledWith(1, { page: 1, limit: 10 });
      expect(result).toEqual(expected);
    });
  });

  describe('findUnassigned', () => {
    it('should delegate to cropRepository.findUnassigned', async () => {
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, nextCursor: null } };
      cropRepository.findUnassigned.mockResolvedValue(expected);

      const result = await service.findUnassigned({ page: 1, limit: 10 });

      expect(cropRepository.findUnassigned).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a crop by id', async () => {
      const expected = { id: 1, season: 'Safra 2021', culture: 'Soja' } as unknown as Crop;
      cropRepository.findOne.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(cropRepository.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });

    it('should throw if crop does not exist', async () => {
      cropRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow('Crop with id 999 not found');
    });
  });
});
