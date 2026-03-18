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
import { ProducersService } from './producers.service';
import { CreateProducerDto } from './dto/create-producer.dto';
import { CreateProducerFullDto } from './dto/create-producer-full.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  CreateProducerDocs,
  CreateProducerFullDocs,
  FindAllProducersDocs,
  FindOneProducerDocs,
  UpdateProducerDocs,
  DeleteProducerDocs,
} from './decorators';

@ApiTags('Producers')
@Controller('producers')
export class ProducersController {
  constructor(private readonly producersService: ProducersService) {}

  @Post()
  @CreateProducerDocs()
  create(@Body() dto: CreateProducerDto) {
    return this.producersService.create(dto);
  }

  @Post('full')
  @CreateProducerFullDocs()
  createFull(@Body() dto: CreateProducerFullDto) {
    return this.producersService.createFull(dto);
  }

  @Get()
  @FindAllProducersDocs()
  findAll(@Query() query: PaginationQueryDto) {
    return this.producersService.findAll(query);
  }

  @Get(':id')
  @FindOneProducerDocs()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.producersService.findOne(id);
  }

  @Patch(':id')
  @UpdateProducerDocs()
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProducerDto) {
    return this.producersService.update(id, dto);
  }

  @Delete(':id')
  @DeleteProducerDocs()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.producersService.remove(id);
  }
}
