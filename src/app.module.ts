import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ProducersModule } from './modules/producers/producers.module';
import { FarmsModule } from './modules/farms/farms.module';
import { CropsModule } from './modules/crops/crops.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ProducersModule,
    FarmsModule,
    CropsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
