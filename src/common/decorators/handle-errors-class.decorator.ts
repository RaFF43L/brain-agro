import { HttpStatus, Logger } from '@nestjs/common';
import { CustomError } from '../errors/custom-error';
export interface HandleErrorsOptions {
  message?: string;
  rethrow?: boolean;
  logger?: Logger;
  logLevel?: 'error' | 'warn' | 'debug' | 'log';
  logStack?: boolean;
  onError?: (error: any, methodName: string, args: any[]) => void;
}

export function HandleErrorsClass(options: HandleErrorsOptions = {}) {
  return function (target: any) {
    const propertyNames = Object.getOwnPropertyNames(target.prototype);
    const className = target.name;

    for (const propertyName of propertyNames) {
      if (propertyName === 'constructor') continue;

      const descriptor = Object.getOwnPropertyDescriptor(
        target.prototype,
        propertyName,
      );

      if (!descriptor || typeof descriptor.value !== 'function') continue;

      const originalMethod = descriptor.value;

      Object.defineProperty(target.prototype, propertyName, {
        ...descriptor,
        async value(...args: any[]) {
          const logger = options.logger || this.logger || new Logger(className);
          const logLevel = options.logLevel || 'error';
          const rethrow = options.rethrow ?? false;
          const logStack = options.logStack !== false;
          const status =
            (options as any).status || HttpStatus.INTERNAL_SERVER_ERROR;

          try {
            return await originalMethod.apply(this, args);
          } catch (error: any) {
            const errorMessage = options.message
              ? `${options.message}: ${error.message}`
              : `Error in ${className}.${propertyName}: ${error.message}`;

            if (logStack) {
              logger[logLevel](errorMessage, error.stack);
            } else {
              logger[logLevel](errorMessage);
            }

            if (options.onError) {
              options.onError(error, propertyName, args);
            }

            if (rethrow) {
              throw error;
            }

            throw new CustomError(
              options.message || error.message,
              status || HttpStatus.INTERNAL_SERVER_ERROR,
              error,
            );
          }
        },
      });
    }
  };
}
