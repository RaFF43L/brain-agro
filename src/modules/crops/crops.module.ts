import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Crop } from './entities/crop.entity';
import { CropsService } from './crops.service';
import { CropsController } from './crops.controller';
import { CropRepository } from './repositories/crop.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Crop])],
  controllers: [CropsController],
  providers: [CropsService, CropRepository],
  exports: [CropsService],
})
export class CropsModule {}
