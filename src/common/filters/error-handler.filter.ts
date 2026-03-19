import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
@Catch()
export class ErrorHandlerFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(ErrorHandlerFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error.';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as { message?: string; details?: unknown };
      message = body.message ?? exception.message;
      details = body.details ?? null;
    }

    const resBody = {
      statusCode: status,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      { resBody },
      `${request.method} ${request.url} ${status}`,
    );

    response.status(status).json(resBody);
  }
}
