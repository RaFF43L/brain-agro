import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { CursorPaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  CreateFarmDocs,
  FindAllFarmsDocs,
  FindOneFarmDocs,
  UpdateFarmDocs,
  DeleteFarmDocs,
} from './decorators';

@ApiTags('Farms')
@Controller()
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post('farms')
  @CreateFarmDocs()
  create(@Body() dto: CreateFarmDto) {
    return this.farmsService.create(dto);
  }

  @Get('producers/:producerId/farms')
  @FindAllFarmsDocs()
  findByProducer(
    @Param('producerId', ParseIntPipe) producerId: number,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.farmsService.findByProducer(producerId, query);
  }

  @Get('farms/:id')
  @FindOneFarmDocs()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.farmsService.findOne(id);
  }

  @Patch('farms/:id')
  @UpdateFarmDocs()
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFarmDto) {
    return this.farmsService.update(id, dto);
  }

  @Delete('farms/:id')
  @DeleteFarmDocs()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.farmsService.remove(id);
  }
}
