import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { pinoHttpConfig } from './common/logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { ProducersModule } from './modules/producers/producers.module';
import { FarmsModule } from './modules/farms/farms.module';
import { CropsModule } from './modules/crops/crops.module';
import { ErrorHandlerFilter } from './common/filters/error-handler.filter';
import { HealthModule } from './modules/health/health.module';
import { CognitoAuthGuard } from './common/guards/cognito-auth.guard';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(pinoHttpConfig),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DatabaseModule,
    ProducersModule,
    FarmsModule,
    CropsModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ErrorHandlerFilter },
    { provide: APP_GUARD, useClass: CognitoAuthGuard },
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule {}
