import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producer } from './entities/producer.entity';
import { ProducersService } from './producers.service';
import { ProducersController } from './producers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Producer])],
  controllers: [ProducersController],
  providers: [ProducersService],
  exports: [ProducersService],
})
export class ProducersModule {}
