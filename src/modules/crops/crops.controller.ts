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
import { CropsService } from './crops.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { CursorPaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  CreateCropDocs,
  FindAllCropsDocs,
  FindOneCropDocs,
  UpdateCropDocs,
  DeleteCropDocs,
} from './decorators';
import { FindUnassignedCropDocs } from './decorators/find-unassigned-crop.decorator';

@ApiTags('Crops')
@Controller()
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Post('crops')
  @CreateCropDocs()
  create(@Body() dto: CreateCropDto) {
    return this.cropsService.create(dto);
  }

  @Get('farms/:farmId/crops')
  @FindAllCropsDocs()
  findByFarm(
    @Param('farmId', ParseIntPipe) farmId: number,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.cropsService.findByFarm(farmId, query);
  }

  @Get('crops/unassigned')
  @FindUnassignedCropDocs()
  finddUnassigned(@Query() query: CursorPaginationQueryDto) {
    return this.cropsService.findUnassigned(query);
  }

  @Get('crops/:id')
  @FindOneCropDocs()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cropsService.findOne(id);
  }

  @Patch('crops/:id')
  @UpdateCropDocs()
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCropDto) {
    return this.cropsService.update(id, dto);
  }

  @Delete('crops/:id')
  @DeleteCropDocs()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cropsService.remove(id);
  }
}
