import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getLoggerToken } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { UsersService } from '../users.service';
import { User } from '../entities/user.entity';

type MockRepository<T = any> = Partial<
  Record<keyof Repository<any>, jest.Mock>
>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getLoggerToken(UsersService.name), useValue: mockLogger },
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const data = {
      email: 'user@test.com',
      name: 'João Silva',
      cognitoId: 'cognito-sub-123',
    };

    it('should create and save a user', async () => {
      const entity = Object.assign(new User(), data);
      const saved = { id: 1, ...data } as User;

      userRepository.create!.mockReturnValue(entity);
      userRepository.save!.mockResolvedValue(saved);

      const result = await service.create(data);

      expect(userRepository.create).toHaveBeenCalledWith(data);
      expect(userRepository.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(saved);
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      const user = { id: 1, email: 'user@test.com' } as User;
      userRepository.findOne!.mockResolvedValue(user);

      const result = await service.findByEmail('user@test.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'user@test.com' },
      });
      expect(result).toEqual(user);
    });

    it('should return null when user is not found', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@test.com');

      expect(result).toBeNull();
    });
  });
});
