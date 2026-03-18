import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Crop } from './entities/crop.entity';
import { CropsService } from './crops.service';
import { CropsController } from './crops.controller';
import { FarmsModule } from '../farms/farms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Crop]), FarmsModule],
  controllers: [CropsController],
  providers: [CropsService],
  exports: [CropsService],
})
export class CropsModule {}
