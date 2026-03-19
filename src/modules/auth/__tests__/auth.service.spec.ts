import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth.service';
import { CustomError } from '../../../common/errors/custom-error';
import { User } from '../../users/entities/user.entity';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  AuthFlowType: { ADMIN_USER_PASSWORD_AUTH: 'ADMIN_USER_PASSWORD_AUTH' },
  AdminCreateUserCommand: jest.fn(),
  AdminDeleteUserCommand: jest.fn(),
  AdminGetUserCommand: jest.fn(),
  AdminInitiateAuthCommand: jest.fn(),
  AdminSetUserPasswordCommand: jest.fn(),
  ConfirmSignUpCommand: jest.fn(),
  ForgotPasswordCommand: jest.fn(),
  ConfirmForgotPasswordCommand: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: { create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    mockSend.mockReset();
    mockUserRepository = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('mock-value') },
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should return success message when user is created', async () => {
      mockSend.mockResolvedValue({
        User: { Attributes: [{ Name: 'sub', Value: 'cognito-sub-123' }] },
      });

      const result = await service.register({
        email: 'test@test.com',
        name: 'Test User',
      });

      expect(result.message).toContain('Registration successful');
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should not save to db if cognito fails', async () => {
      const error = Object.assign(new Error(), { name: 'UsernameExistsException' });
      mockSend.mockRejectedValue(error);

      await expect(
        service.register({ email: 'test@test.com', name: 'Test User' }),
      ).rejects.toBeInstanceOf(CustomError);

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should delete cognito user if db save fails', async () => {
      mockSend
        .mockResolvedValueOnce({
          User: { Attributes: [{ Name: 'sub', Value: 'cognito-sub-123' }] },
        })
        .mockResolvedValueOnce({});
      mockUserRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.register({ email: 'test@test.com', name: 'Test User' }),
      ).rejects.toBeInstanceOf(CustomError);

      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should throw ConflictException for duplicate email', async () => {
      const error = Object.assign(new Error(), { name: 'UsernameExistsException' });
      mockSend.mockRejectedValue(error);

      await expect(service.register({ email: 'test@test.com', name: 'Test' })).rejects.toThrow(
        CustomError,
      );
    });

    it('should throw BadRequestException for invalid password', async () => {
      const error = Object.assign(new Error(), { name: 'InvalidPasswordException' });
      mockSend.mockRejectedValue(error);

      await expect(service.register({ email: 'test@test.com', name: 'Test' })).rejects.toThrow(
        CustomError,
      );
    });
  });

  describe('login', () => {
    it('should return tokens on success', async () => {
      mockSend.mockResolvedValueOnce({ UserStatus: 'CONFIRMED' }).mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600,
        },
      });

      const result = await service.login({ email: 'test@test.com', password: 'Password@123' });

      expect(result.accessToken).toBe('access-token');
      expect(result.idToken).toBe('id-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(3600);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should throw for wrong credentials', async () => {
      mockSend
        .mockResolvedValueOnce({ UserStatus: 'CONFIRMED' })
        .mockRejectedValueOnce(Object.assign(new Error(), { name: 'NotAuthorizedException' }));

      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(
        CustomError,
      );
    });

    it('should throw for unconfirmed account', async () => {
      mockSend.mockResolvedValueOnce({ UserStatus: 'UNCONFIRMED' });

      await expect(
        service.login({ email: 'test@test.com', password: 'Password@123' }),
      ).rejects.toThrow(CustomError);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should set new password and return tokens when FORCE_CHANGE_PASSWORD', async () => {
      mockSend
        .mockResolvedValueOnce({ UserStatus: 'FORCE_CHANGE_PASSWORD' })
        .mockResolvedValueOnce({ ChallengeName: 'NEW_PASSWORD_REQUIRED' })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          AuthenticationResult: {
            AccessToken: 'access-token',
            IdToken: 'id-token',
            RefreshToken: 'refresh-token',
            ExpiresIn: 3600,
          },
        });

      const result = await service.login({
        email: 'test@test.com',
        password: 'TempPass@1',
        newPassword: 'NewPass@123',
      });

      expect(mockSend).toHaveBeenCalledTimes(4);
      expect(result.accessToken).toBe('access-token');
    });

    it('should throw when FORCE_CHANGE_PASSWORD but newPassword not provided', async () => {
      mockSend.mockResolvedValueOnce({ UserStatus: 'FORCE_CHANGE_PASSWORD' });

      await expect(
        service.login({ email: 'test@test.com', password: 'TempPass@1' }),
      ).rejects.toThrow(CustomError);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirmSignUp', () => {
    it('should confirm account successfully', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.confirmSignUp({ email: 'test@test.com', code: '123456' });

      expect(result.message).toContain('confirmed');
    });

    it('should throw BadRequestException for wrong code', async () => {
      const error = Object.assign(new Error(), { name: 'CodeMismatchException' });
      mockSend.mockRejectedValue(error);

      await expect(
        service.confirmSignUp({ email: 'test@test.com', code: '000000' }),
      ).rejects.toThrow(CustomError);
    });
  });

  describe('forgotPassword', () => {
    it('should return generic success message', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.forgotPassword({ email: 'test@test.com' });

      expect(result.message).toBeDefined();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.resetPassword({
        email: 'test@test.com',
        code: '123456',
        newPassword: 'NewPassword@123',
      });

      expect(result.message).toContain('Password reset successfully');
    });

    it('should throw BadRequestException for expired code', async () => {
      const error = Object.assign(new Error(), { name: 'ExpiredCodeException' });
      mockSend.mockRejectedValue(error);

      await expect(
        service.resetPassword({
          email: 'test@test.com',
          code: '123456',
          newPassword: 'NewPassword@123',
        }),
      ).rejects.toThrow(CustomError);
    });
  });
});
