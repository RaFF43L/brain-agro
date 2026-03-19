import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  process.env.AUTH_ENABLED = '';
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'brain_agro_test';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  return app;
}

export async function truncateTables(app: INestApplication): Promise<void> {
  const ds = app.get<DataSource>(getDataSourceToken());
  await ds.query(
    'TRUNCATE TABLE crops, farms, producers, users RESTART IDENTITY CASCADE',
  );
}
