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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProducersService } from './producers.service';
import { CreateProducerDto } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import {
  CreateProducerDocs,
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

  @Get()
  @FindAllProducersDocs()
  findAll() {
    return this.producersService.findAll();
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
