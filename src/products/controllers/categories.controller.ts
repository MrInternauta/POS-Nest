import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { FilterDto } from '../../core/interfaces/filter.dto';
import { ParseIntPipe } from '../../core/pipes/parse-int.pipe';
import { Store } from '../../stores/entities/store.entity';
import { CurrentStore, StoreGuard } from '../../stores/guards/store.guard';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { CategoriesService } from '../services/categories.service';

//Everyone in the store reads them, only its owner changes them
@Controller('categories')
@UseGuards(JwtAuthGuard, StoreGuard, RolesGuard)
@RoleD(Role.OWNER, Role.CASHIER)
@ApiTags('categories')
export class CategoriesController {
  constructor(private categoriesServices: CategoriesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Categories list' })
  async getCategories(@CurrentStore() store: Store, @Query() params: FilterDto) {
    return { categories: await this.categoriesServices.findAll(store.id, params) };
  }

  @Get(':categoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get category by Id' })
  async getCategory(@CurrentStore() store: Store, @Param('categoryId', ParseIntPipe) categoryId: number) {
    return { category: await this.categoriesServices.findOne(store.id, categoryId) };
  }

  @Post()
  @RoleD(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  async create(@CurrentStore() store: Store, @Body() category: CreateCategoryDto) {
    return {
      message: 'Category created',
      //The key the app has always read the new category from
      product: await this.categoriesServices.create(store.id, category),
    };
  }

  @Put(':idCategory')
  @RoleD(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a category' })
  async update(
    @CurrentStore() store: Store,
    @Param('idCategory', ParseIntPipe) idCategory: number,
    @Body() category: UpdateCategoryDto
  ) {
    return {
      message: 'Category updated',
      category: await this.categoriesServices.update(store.id, idCategory, category),
    };
  }

  @Put(':idCategory/restore')
  @RoleD(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'restore a category' })
  async restore(@CurrentStore() store: Store, @Param('idCategory', ParseIntPipe) idCategory: number) {
    const restored = await this.categoriesServices.restore(store.id, idCategory);
    if (!restored?.affected) {
      throw new BadRequestException(`Category ${idCategory} not restored`);
    }
    return { message: 'Category restored' };
  }

  @Delete(':idCategory')
  @RoleD(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category' })
  async delete(@CurrentStore() store: Store, @Param('idCategory', ParseIntPipe) idCategory: number) {
    await this.categoriesServices.remove(store.id, idCategory);
    return { message: `Category ${idCategory} deleted` };
  }
}
