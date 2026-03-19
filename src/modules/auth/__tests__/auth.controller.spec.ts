import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  confirmSignUp: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should call authService.register with the dto', async () => {
      const dto = { email: 'test@test.com', password: 'Password@123', name: 'Test User' };
      mockAuthService.register.mockResolvedValue({
        message: 'Registration successful.',
        userId: '1',
      });

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result.message).toContain('Registration');
    });
  });

  describe('login', () => {
    it('should call authService.login with the dto', async () => {
      const dto = { email: 'test@test.com', password: 'Password@123' };
      mockAuthService.login.mockResolvedValue({ accessToken: 'token' });

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result.accessToken).toBe('token');
    });
  });

  describe('confirmSignUp', () => {
    it('should call authService.confirmSignUp with the dto', async () => {
      const dto = { email: 'test@test.com', code: '123456' };
      mockAuthService.confirmSignUp.mockResolvedValue({
        message: 'Account confirmed successfully.',
      });

      const result = await controller.confirmSignUp(dto);

      expect(mockAuthService.confirmSignUp).toHaveBeenCalledWith(dto);
      expect(result.message).toContain('confirmed');
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword with the dto', async () => {
      const dto = { email: 'test@test.com' };
      mockAuthService.forgotPassword.mockResolvedValue({ message: 'E-mail enviado.' });

      await controller.forgotPassword(dto);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword with the dto', async () => {
      const dto = { email: 'test@test.com', code: '123456', newPassword: 'NewPassword@123' };
      mockAuthService.resetPassword.mockResolvedValue({ message: 'Password reset successfully.' });

      const result = await controller.resetPassword(dto);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result.message).toContain('Password reset');
    });
  });
});
