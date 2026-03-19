import { Test, TestingModule } from '@nestjs/testing';
import { ProducersController } from '../producers.controller';
import { ProducersService } from '../producers.service';

const mockProducersService = {
  create: jest.fn(),
  createFull: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ProducersController', () => {
  let controller: ProducersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProducersController],
      providers: [{ provide: ProducersService, useValue: mockProducersService }],
    }).compile();

    controller = module.get<ProducersController>(ProducersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call producersService.create with dto', async () => {
      const dto = { cpfCnpj: '52998224725', name: 'João Silva' };
      const saved = { id: 1, ...dto };
      mockProducersService.create.mockResolvedValue(saved);

      const result = await controller.create(dto);

      expect(mockProducersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(saved);
    });
  });

  describe('createFull', () => {
    it('should call producersService.createFull with dto', async () => {
      const dto = { cpfCnpj: '52998224725', name: 'João Silva', farms: [] };
      const saved = { id: 1, ...dto };
      mockProducersService.createFull.mockResolvedValue(saved);

      const result = await controller.createFull(dto as any);

      expect(mockProducersService.createFull).toHaveBeenCalledWith(dto);
      expect(result).toEqual(saved);
    });
  });

  describe('findAll', () => {
    it('should call producersService.findAll with query and return paginated result', async () => {
      const query = { page: 1, limit: 10 };
      const paginated = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false } };
      mockProducersService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll(query as any);

      expect(mockProducersService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginated);
    });
  });

  describe('findOne', () => {
    it('should call producersService.findOne with id', async () => {
      const producer = { id: 1, name: 'João Silva' };
      mockProducersService.findOne.mockResolvedValue(producer);

      const result = await controller.findOne(1);

      expect(mockProducersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(producer);
    });
  });

  describe('update', () => {
    it('should call producersService.update with id and dto', async () => {
      const dto = { name: 'João Souza' };
      const updated = { id: 1, cpfCnpj: '52998224725', name: 'João Souza' };
      mockProducersService.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto as any);

      expect(mockProducersService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should call producersService.remove with id', async () => {
      mockProducersService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(mockProducersService.remove).toHaveBeenCalledWith(1);
    });
  });
});
