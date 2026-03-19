import { Body, Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmSignUpDto } from './dto/confirm-signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  AuthTag,
  ConfirmSignUpRoute,
  ForgotPasswordRoute,
  LoginRoute,
  RegisterRoute,
  ResetPasswordRoute,
} from './decorators/auth-routes.decorator';
import { Public } from '../../common/decorators/public.decorator';

@AuthTag()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @RegisterRoute()
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @LoginRoute()
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ConfirmSignUpRoute()
  confirmSignUp(@Body() dto: ConfirmSignUpDto) {
    return this.authService.confirmSignUp(dto);
  }

  @ForgotPasswordRoute()
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ResetPasswordRoute()
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
