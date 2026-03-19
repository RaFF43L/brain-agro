import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { mapCognitoError } from '../../common/helpers/cognito-error.helper';
import { CustomError } from '../../common/errors/custom-error';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmSignUpDto } from './dto/confirm-signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { AuthTokens } from './entities/auth-tokens.entity';

@Injectable()
export class AuthService {
  private readonly cognito: CognitoIdentityProviderClient;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly userPoolId: string;

  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.cognito = new CognitoIdentityProviderClient({
      region: this.config.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID_COGNITO'),
        secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY_COGNITO'),
      },
    });
    this.clientId = this.config.getOrThrow<string>('COGNITO_CLIENT_ID');
    this.clientSecret = this.config.getOrThrow<string>('COGNITO_CLIENT_SECRET');
    this.userPoolId = this.config.getOrThrow<string>('COGNITO_USER_POOL_ID');
  }

  async register(dto: RegisterDto) {
    const password = this.generateTemporaryPassword();
    let cognitoId: string | undefined;

    try {
      const result = await this.cognito.send(
        new AdminCreateUserCommand({
          UserPoolId: this.userPoolId,
          Username: dto.email,
          TemporaryPassword: password,
          UserAttributes: [
            { Name: 'email', Value: dto.email },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'name', Value: dto.name },
          ],
        }),
      );

      cognitoId = result.User!.Attributes!.find((a) => a.Name === 'sub')!.Value!;

      await this.usersService.create({ email: dto.email, name: dto.name, cognitoId });

      return {
        message: 'Registration successful. A temporary password was sent to the provided email.',
      };
    } catch (error) {
      if (cognitoId) {
        this.logger.error(
          `DB transaction failed after Cognito registration — rolling back Cognito user. email=${dto.email}`,
          error instanceof Error ? error.stack : String(error),
        );
        await this.cognito
          .send(new AdminDeleteUserCommand({ UserPoolId: this.userPoolId, Username: dto.email }))
          .catch((deleteError: unknown) =>
            this.logger.error(
              `Failed to roll back Cognito user. email=${dto.email}`,
              deleteError instanceof Error ? deleteError.stack : String(deleteError),
            ),
          );
        throw new CustomError(
          'Internal server error. Please try again later.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw mapCognitoError(error);
    }
  }

  private generateSecretHash(username: string): string {
    return createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  private generateTemporaryPassword(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const symbols = '!@#$%&*';
    const all = upper + lower + digits + symbols;

    const rand = (charset: string) => charset[randomBytes(1)[0] % charset.length];

    const required = [rand(upper), rand(lower), rand(digits), rand(symbols)];
    const rest = Array.from({ length: 8 }, () => rand(all));

    return [...required, ...rest].sort(() => randomBytes(1)[0] - 128).join('');
  }

  async login(dto: LoginDto) {
    const { email, password, newPassword } = dto;

    this.logger.info(`[login] attempt email=${email}`);

    try {
      const userStatus = await this.getUserStatus(email);
      this.logger.debug(`[login] userStatus=${userStatus} email=${email}`);

      const actions: Record<string, () => Promise<AuthTokens>> = {
        CONFIRMED: () => this.authenticateUser(email, password),
        UNCONFIRMED: () => {
          throw new CustomError(
            'Account not confirmed. Please verify your email.',
            HttpStatus.FORBIDDEN,
          );
        },
        FORCE_CHANGE_PASSWORD: async () => {
          if (!newPassword) {
            throw new CustomError('New password is required.', HttpStatus.UNPROCESSABLE_ENTITY);
          }
          return this.setNewPassword(email, password, newPassword);
        },
      };

      const action = actions[userStatus];
      if (!action) {
        this.logger.warn(`[login] unexpected userStatus=${userStatus} email=${email}`);
        throw new CustomError(
          `Unexpected user status: ${userStatus}.`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return await action();
    } catch (error) {
      if (error instanceof CustomError) throw error;
      const err = error as { name?: string; message?: string };
      this.logger.warn(
        `[login] cognito error name=${err.name ?? 'unknown'} message="${err.message ?? ''}" email=${email}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw mapCognitoError(error);
    }
  }

  private async getUserStatus(username: string): Promise<string> {
    const response = await this.cognito.send(
      new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      }),
    );
    return response.UserStatus ?? 'UNKNOWN';
  }

  private async authenticateUser(username: string, password: string): Promise<AuthTokens> {
    const result = await this.cognito.send(
      new AdminInitiateAuthCommand({
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
          SECRET_HASH: this.generateSecretHash(username),
        },
      }),
    );

    if (!result.AuthenticationResult) {
      throw new CustomError('Authentication failed.', HttpStatus.UNAUTHORIZED);
    }

    return {
      accessToken: result.AuthenticationResult.AccessToken,
      idToken: result.AuthenticationResult.IdToken,
      refreshToken: result.AuthenticationResult.RefreshToken,
      expiresIn: result.AuthenticationResult.ExpiresIn,
    };
  }

  private async setNewPassword(
    username: string,
    tempPassword: string,
    newPassword: string,
  ): Promise<AuthTokens> {
    const initResult = await this.cognito.send(
      new AdminInitiateAuthCommand({
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: tempPassword,
          SECRET_HASH: this.generateSecretHash(username),
        },
      }),
    );

    if (initResult.ChallengeName !== 'NEW_PASSWORD_REQUIRED') {
      throw new CustomError('Unexpected authentication challenge.', HttpStatus.BAD_REQUEST);
    }

    await this.cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        Password: newPassword,
        Permanent: true,
      }),
    );

    return this.authenticateUser(username, newPassword);
  }

  async confirmSignUp(dto: ConfirmSignUpDto) {
    try {
      await this.cognito.send(
        new ConfirmSignUpCommand({
          ClientId: this.clientId,
          Username: dto.email,
          ConfirmationCode: dto.code,
        }),
      );

      return { message: 'Account confirmed successfully.' };
    } catch (error) {
      throw mapCognitoError(error);
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      await this.cognito.send(
        new ForgotPasswordCommand({
          ClientId: this.clientId,
          Username: dto.email,
        }),
      );

      return {
        message: 'If this email is registered, you will receive a code to reset your password.',
      };
    } catch (error) {
      throw mapCognitoError(error);
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      await this.cognito.send(
        new ConfirmForgotPasswordCommand({
          ClientId: this.clientId,
          Username: dto.email,
          ConfirmationCode: dto.code,
          Password: dto.newPassword,
        }),
      );

      return { message: 'Password reset successfully.' };
    } catch (error) {
      throw mapCognitoError(error);
    }
  }
}
