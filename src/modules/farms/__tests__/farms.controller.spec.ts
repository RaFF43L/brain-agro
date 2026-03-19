import { Test, TestingModule } from '@nestjs/testing';
import { FarmsController } from '../farms.controller';
import { FarmsService } from '../farms.service';

const mockFarmsService = {
  create: jest.fn(),
  findByProducer: jest.fn(),
  findUnassigned: jest.fn(),
  getDashboard: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('FarmsController', () => {
  let controller: FarmsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmsController],
      providers: [{ provide: FarmsService, useValue: mockFarmsService }],
    }).compile();

    controller = module.get<FarmsController>(FarmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call farmsService.create with dto', async () => {
      const dto = {
        name: 'Fazenda Boa Vista',
        city: 'Ribeirão Preto',
        state: 'SP',
        totalArea: 1000,
        arableArea: 600,
        vegetationArea: 400,
        producerId: 1,
      };
      const saved = { id: 1, ...dto };
      mockFarmsService.create.mockResolvedValue(saved);

      const result = await controller.create(dto as any);

      expect(mockFarmsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(saved);
    });
  });

  describe('findByProducer', () => {
    it('should call farmsService.findByProducer with producerId and query', async () => {
      const query = { page: 1, limit: 10 };
      const paginated = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, nextCursor: null } };
      mockFarmsService.findByProducer.mockResolvedValue(paginated);

      const result = await controller.findByProducer(1, query as any);

      expect(mockFarmsService.findByProducer).toHaveBeenCalledWith(1, query);
      expect(result).toEqual(paginated);
    });
  });

  describe('findUnassigned', () => {
    it('should call farmsService.findUnassigned with query', async () => {
      const query = { page: 1, limit: 10 };
      const paginated = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, nextCursor: null } };
      mockFarmsService.findUnassigned.mockResolvedValue(paginated);

      const result = await controller.findUnassigned(query as any);

      expect(mockFarmsService.findUnassigned).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginated);
    });
  });

  describe('getDashboard', () => {
    it('should call farmsService.getDashboard with query', async () => {
      const query = {};
      const dashboard = { totalFarms: 5, totalHectares: 2000, byState: [], byCulture: [], landUse: { arableArea: 1200, vegetationArea: 800 } };
      mockFarmsService.getDashboard.mockResolvedValue(dashboard);

      const result = await controller.getDashboard(query as any);

      expect(mockFarmsService.getDashboard).toHaveBeenCalledWith(query);
      expect(result).toEqual(dashboard);
    });
  });

  describe('findOne', () => {
    it('should call farmsService.findOne with id', async () => {
      const farm = { id: 1, name: 'Fazenda Boa Vista' };
      mockFarmsService.findOne.mockResolvedValue(farm);

      const result = await controller.findOne(1);

      expect(mockFarmsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(farm);
    });
  });

  describe('update', () => {
    it('should call farmsService.update with id and dto', async () => {
      const dto = { name: 'Fazenda Nova' };
      const updated = { id: 1, name: 'Fazenda Nova' };
      mockFarmsService.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto as any);

      expect(mockFarmsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should call farmsService.remove with id', async () => {
      mockFarmsService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(mockFarmsService.remove).toHaveBeenCalledWith(1);
    });
  });
});
