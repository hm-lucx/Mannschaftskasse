import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FinesService } from './fines.service';
import { CreateFineDto } from './dto/create-fine.dto';
import { CreateFineCategoryDto } from './dto/create-fine-category.dto';
import { FineStatus } from './entities/fine.entity';

@Controller('fines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinesController {
  constructor(private finesService: FinesService) {}

  @Get('categories')
  getCategories() {
    return this.finesService.findAllCategories();
  }

  @Post('categories')
  @Roles('ADMIN', 'COACH')
  createCategory(@Body() dto: CreateFineCategoryDto, @CurrentUser('id') userId: string) {
    return this.finesService.createCategory(dto, userId);
  }

  @Put('categories/:id')
  @Roles('ADMIN', 'COACH')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: Partial<CreateFineCategoryDto>,
    @CurrentUser('id') userId: string,
  ) {
    return this.finesService.updateCategory(id, dto, userId);
  }

  @Delete('categories/:id')
  @Roles('ADMIN', 'COACH')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCategory(@Param('id') id: string) {
    return this.finesService.deleteCategory(id);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: FineStatus,
  ) {
    return this.finesService.findAll(user.id, user.roles || [], status);
  }

  @Post()
  @Roles('ADMIN', 'COACH')
  create(@Body() dto: CreateFineDto, @CurrentUser('id') userId: string) {
    return this.finesService.create(dto, userId);
  }

  @Put(':id')
  @Roles('ADMIN', 'COACH')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateFineDto>,
    @CurrentUser('id') userId: string,
  ) {
    return this.finesService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'COACH')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.finesService.cancel(id, userId);
  }
}
