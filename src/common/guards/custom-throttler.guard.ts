import { ThrottlerGuard } from '@nestjs/throttler';

export class CustomThrottlerGuard extends ThrottlerGuard {
  protected errorMessage = 'Too many attempts. Please wait and try again.';
}
