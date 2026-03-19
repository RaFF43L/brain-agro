import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { FarmsService } from '../farms.service';
import { FarmRepository } from '../repositories/farm.repository';
import { Farm } from '../entities/farm.entity';

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const createMockFarmRepository = () => ({
  findByProducer: jest.fn(),
  findUnassigned: jest.fn(),
  getDashboard: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  applyFilters: jest.fn(),
});

describe('FarmsService', () => {
  let service: FarmsService;
  let farmRepository: ReturnType<typeof createMockFarmRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmsService,
        { provide: getLoggerToken(FarmsService.name), useValue: mockLogger },
        { provide: FarmRepository, useValue: createMockFarmRepository() },
      ],
    }).compile();

    service = module.get<FarmsService>(FarmsService);
    farmRepository = module.get(FarmRepository);
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
    };

    it('should create a farm', async () => {
      const saved = { id: 1, ...dto };
      farmRepository.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(farmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: dto.name }),
      );
      expect(result).toEqual(saved);
    });

    it('should throw if arableArea + vegetationArea exceeds totalArea', async () => {
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
    } as unknown as Farm;

    it('should update a farm', async () => {
      const updated = { ...existing, name: 'Fazenda Nova' };
      farmRepository.findOne.mockResolvedValue(existing);
      farmRepository.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'Fazenda Nova' });

      expect(farmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Fazenda Nova' }),
      );
      expect(result.name).toBe('Fazenda Nova');
    });

    it('should throw if farm does not exist', async () => {
      farmRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X' })).rejects.toThrow(
        'Farm with id 999 not found',
      );
    });

    it('should throw if arableArea + vegetationArea exceeds totalArea after update', async () => {
      farmRepository.findOne.mockResolvedValue(existing);

      await expect(
        service.update(1, { arableArea: 800 }),
      ).rejects.toThrow(
        'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda',
      );

      expect(farmRepository.save).not.toHaveBeenCalled();
    });

    it('should throw if new totalArea is less than existing sum', async () => {
      farmRepository.findOne.mockResolvedValue(existing);

      await expect(
        service.update(1, { totalArea: 500 }),
      ).rejects.toThrow(
        'A soma das áreas agricultável e de vegetação não pode ultrapassar a área total da fazenda',
      );

      expect(farmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByProducer', () => {
    it('should delegate to farmRepository.findByProducer', async () => {
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, nextCursor: null } };
      farmRepository.findByProducer.mockResolvedValue(expected);

      const result = await service.findByProducer(1, { page: 1, limit: 10 });

      expect(farmRepository.findByProducer).toHaveBeenCalledWith(1, { page: 1, limit: 10 });
      expect(result).toEqual(expected);
    });
  });

  describe('findUnassigned', () => {
    it('should delegate to farmRepository.findUnassigned', async () => {
      const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, nextCursor: null } };
      farmRepository.findUnassigned.mockResolvedValue(expected);

      const result = await service.findUnassigned({ page: 1, limit: 10 });

      expect(farmRepository.findUnassigned).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a farm by id', async () => {
      const expected = { id: 1, name: 'Fazenda Boa Vista' } as unknown as Farm;
      farmRepository.findOne.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(farmRepository.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });

    it('should throw if farm does not exist', async () => {
      farmRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow('Farm with id 999 not found');
    });
  });
});
