import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from './entities/farm.entity';
import { FarmsService } from './farms.service';
import { FarmsController } from './farms.controller';
import { FarmRepository } from './repositories/farm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Farm])],
  controllers: [FarmsController],
  providers: [FarmsService, FarmRepository],
  exports: [FarmsService],
})
export class FarmsModule {}
