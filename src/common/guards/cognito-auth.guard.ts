import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private readonly issuer: string = '';
  private readonly authEnabled: boolean;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService,
  ) {
    this.authEnabled = config.get<string>('AUTH_ENABLED') === 'true';

    if (this.authEnabled) {
      const region = config.get<string>('AWS_REGION') ?? '';
      const userPoolId = config.get<string>('COGNITO_USER_POOL_ID') ?? '';
      this.issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
      this.jwks = createRemoteJWKSet(
        new URL(`${this.issuer}/.well-known/jwks.json`),
      );
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.authEnabled) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException();

    try {
      await jwtVerify(token, this.jwks!, { issuer: this.issuer });
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return undefined;
    return auth.slice(7);
  }
}
