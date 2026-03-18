import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProducersService } from '../producers.service';
import { Producer } from '../entities/producer.entity';

type MockRepository<T = any> = Partial<
  Record<keyof Repository<any>, jest.Mock>
>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('ProducersService', () => {
  let service: ProducersService;
  let producerRepository: MockRepository<Producer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducersService,
        {
          provide: getRepositoryToken(Producer),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ProducersService>(ProducersService);
    producerRepository = module.get(getRepositoryToken(Producer));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a producer', async () => {
      const dto = { cpfCnpj: '12345678901', name: 'João Silva' };
      const expected = { id: 1, ...dto, farms: [], createdAt: new Date(), updatedAt: new Date() };

      producerRepository.create!.mockReturnValue(expected);
      producerRepository.save!.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(producerRepository.create).toHaveBeenCalledWith(dto);
      expect(producerRepository.save).toHaveBeenCalledWith(expected);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a producer by id', async () => {
      const expected = { id: 1, cpfCnpj: '12345678901', name: 'João Silva', farms: [] } as unknown as Producer;

      producerRepository.findOne!.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(producerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['farms'],
      });
      expect(result).toEqual(expected);
    });

    it('should throw if producer does not exist', async () => {
      producerRepository.findOne!.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow('Producer with id 999 not found');
    });
  });

  describe('findAll', () => {
    it('should return all producers', async () => {
      const expected = [{ id: 1, cpfCnpj: '12345678901', name: 'João Silva', farms: [] }] as unknown as Producer[];

      producerRepository.find!.mockResolvedValue(expected);

      const result = await service.findAll();

      expect(producerRepository.find).toHaveBeenCalledWith({ relations: ['farms'] });
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should update a producer', async () => {
      const existing = { id: 1, cpfCnpj: '12345678901', name: 'João Silva' } as unknown as Producer;
      const updated = { ...existing, name: 'João Souza' } as unknown as Producer;

      producerRepository.findOne!.mockResolvedValue(existing);
      producerRepository.save!.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'João Souza' });

      expect(producerRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('João Souza');
    });

    it('should throw if producer does not exist', async () => {
      producerRepository.findOne!.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Ninguém' })).rejects.toThrow('Producer with id 999 not found');
    });
  });

  describe('remove', () => {
    it('should remove a producer', async () => {
      const existing = { id: 1, cpfCnpj: '12345678901', name: 'João Silva' } as unknown as Producer;

      producerRepository.findOne!.mockResolvedValue(existing);
      producerRepository.remove!.mockResolvedValue(existing);

      await service.remove(1);

      expect(producerRepository.remove).toHaveBeenCalledWith(existing);
    });

    it('should throw if producer does not exist', async () => {
      producerRepository.findOne!.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow('Producer with id 999 not found');
    });
  });
});
