import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomError extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST, details?: unknown) {
    super({ message, details }, status);
  }
}
