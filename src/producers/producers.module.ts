import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producer } from './entities/producer.entity';
import { Farm } from './entities/farm.entity';
import { Crop } from './entities/crop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Producer, Farm, Crop])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class ProducersModule {}
