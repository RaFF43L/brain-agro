import { applyDecorators, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

export const AuthTag = () => applyDecorators(ApiTags('Auth'));

export const RegisterRoute = () =>
  applyDecorators(
    Post('register'),
    Throttle({ default: { ttl: 60, limit: 5 } }),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Register a new user' }),
    ApiResponse({ status: 201, description: 'User registered successfully.' }),
    ApiResponse({ status: 409, description: 'Email already in use.' }),
  );

export const LoginRoute = () =>
  applyDecorators(
    Post('login'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'Authenticate user and return tokens' }),
    ApiResponse({ status: 200, description: 'Authentication successful.' }),
    ApiResponse({ status: 401, description: 'Invalid credentials.' }),
  );

export const ConfirmSignUpRoute = () =>
  applyDecorators(
    Post('confirm'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'Confirm user sign-up with verification code' }),
    ApiResponse({ status: 200, description: 'Account confirmed.' }),
  );

export const ForgotPasswordRoute = () =>
  applyDecorators(
    Post('forgot-password'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'Send password reset code to email' }),
    ApiResponse({ status: 200, description: 'Reset code sent.' }),
  );

export const ResetPasswordRoute = () =>
  applyDecorators(
    Post('reset-password'),
    HttpCode(HttpStatus.OK),
    Public(),
    ApiOperation({ summary: 'Reset password using the verification code' }),
    ApiResponse({ status: 200, description: 'Password reset successfully.' }),
  );
