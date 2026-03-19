import { HttpStatus } from '@nestjs/common';
import { CustomError } from '../errors/custom-error';

export function mapCognitoError(error: unknown): CustomError {
  const err = error as { name?: string };

  switch (err.name) {
    case 'NotAuthorizedException':
      return new CustomError('Invalid email or password.', HttpStatus.UNAUTHORIZED);
    case 'UserNotConfirmedException':
      return new CustomError(
        'Account not confirmed. Please verify your email.',
        HttpStatus.FORBIDDEN,
      );
    case 'UsernameExistsException':
      return new CustomError('This email is already registered.', HttpStatus.CONFLICT);
    case 'InvalidPasswordException':
      return new CustomError(
        'Password does not meet the minimum security requirements.',
        HttpStatus.BAD_REQUEST,
      );
    case 'CodeMismatchException':
      return new CustomError('Invalid code.', HttpStatus.BAD_REQUEST);
    case 'ExpiredCodeException':
      return new CustomError('Code has expired. Please request a new one.', HttpStatus.BAD_REQUEST);
    case 'UserNotFoundException':
      return new CustomError('User not found.', HttpStatus.NOT_FOUND);
    case 'LimitExceededException':
      return new CustomError(
        'Too many attempts. Please wait and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    default:
      return new CustomError(
        'Internal server error. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }
}
