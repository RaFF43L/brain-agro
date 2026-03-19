import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producer } from './entities/producer.entity';
import { ProducersService } from './producers.service';
import { ProducersController } from './producers.controller';
import { ProducerRepository } from './repositories/producer.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Producer])],
  controllers: [ProducersController],
  providers: [ProducersService, ProducerRepository],
  exports: [ProducersService],
})
export class ProducersModule {}
