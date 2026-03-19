import { Test, TestingModule } from '@nestjs/testing';
import { CropsController } from '../crops.controller';
import { CropsService } from '../crops.service';

const mockCropsService = {
  create: jest.fn(),
  findByFarm: jest.fn(),
  findUnassigned: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('CropsController', () => {
  let controller: CropsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CropsController],
      providers: [{ provide: CropsService, useValue: mockCropsService }],
    }).compile();

    controller = module.get<CropsController>(CropsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call cropsService.create with dto', async () => {
      const dto = { season: 'Safra 2024', culture: 'Soja', farmId: 1 };
      const saved = { id: 1, ...dto };
      mockCropsService.create.mockResolvedValue(saved);

      const result = await controller.create(dto);

      expect(mockCropsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(saved);
    });
  });

  describe('findByFarm', () => {
    it('should call cropsService.findByFarm with farmId and query', async () => {
      const query = { page: 1, limit: 10 };
      const paginated = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, nextCursor: null } };
      mockCropsService.findByFarm.mockResolvedValue(paginated);

      const result = await controller.findByFarm(1, query as any);

      expect(mockCropsService.findByFarm).toHaveBeenCalledWith(1, query);
      expect(result).toEqual(paginated);
    });
  });

  describe('findUnassigned', () => {
    it('should call cropsService.findUnassigned with query', async () => {
      const query = { page: 1, limit: 10 };
      const paginated = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, nextCursor: null } };
      mockCropsService.findUnassigned.mockResolvedValue(paginated);

      const result = await controller.finddUnassigned(query as any);

      expect(mockCropsService.findUnassigned).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginated);
    });
  });

  describe('findOne', () => {
    it('should call cropsService.findOne with id', async () => {
      const crop = { id: 1, season: 'Safra 2024', culture: 'Soja' };
      mockCropsService.findOne.mockResolvedValue(crop);

      const result = await controller.findOne(1);

      expect(mockCropsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(crop);
    });
  });

  describe('update', () => {
    it('should call cropsService.update with id and dto', async () => {
      const dto = { culture: 'Milho' };
      const updated = { id: 1, season: 'Safra 2024', culture: 'Milho' };
      mockCropsService.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto as any);

      expect(mockCropsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should call cropsService.remove with id', async () => {
      mockCropsService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(mockCropsService.remove).toHaveBeenCalledWith(1);
    });
  });
});
