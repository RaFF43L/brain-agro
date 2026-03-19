import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { DatabaseModule } from './database/database.module';
import { ProducersModule } from './modules/producers/producers.module';
import { FarmsModule } from './modules/farms/farms.module';
import { CropsModule } from './modules/crops/crops.module';
import { ErrorHandlerFilter } from './common/filters/error-handler.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: true,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        customLogLevel(_req, res, err) {
          if (err || res.statusCode >= 400) return 'silent';
          return 'info';
        },
        serializers: {
          req(req) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
              params: req.params,
            };
          },
          res(res) {
            return { statusCode: res.statusCode };
          },
        },
        customProps(_req, res) {
          const r = res as any;
          if (!r._pinoBodyPatched) {
            r._pinoBodyPatched = true;
            const original = r.json?.bind(r);
            if (original) {
              r.json = function (body: unknown) {
                r._resBody = body;
                return original(body);
              };
            }
          }
          return { context: 'HTTP' };
        },
        customSuccessObject(_req, res, val) {
          if (process.env.NODE_ENV === 'production') return val;
          const body = (res as any)._resBody;
          return body !== undefined ? { ...val, resBody: body } : val;
        },
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DatabaseModule,
    ProducersModule,
    FarmsModule,
    CropsModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: ErrorHandlerFilter }],
})
export class AppModule {}
