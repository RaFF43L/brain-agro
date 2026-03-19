import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const basicAuth =
  require('express-basic-auth') as typeof import('express-basic-auth');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerPassword = process.env.SWAGGER_PASSWORD;

  if (swaggerPassword) {
    app.use(
      ['/api/docs', '/api/reference'],
      basicAuth({
        users: { admin: swaggerPassword },
        challenge: true,
      }),
    );
  }

  const config = new DocumentBuilder()
    .setTitle('Brain Agro')
    .setDescription('API de gerenciamento de produtores rurais')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  app.use(
    '/api/reference',
    apiReference({
      content: document,
    }),
  );

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
