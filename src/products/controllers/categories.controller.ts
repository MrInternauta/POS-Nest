import {
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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { Is_PublicD } from '../../core/auth/decorators/public.decorator';
import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { ParseIntPipe } from '../../core/pipes/parse-int.pipe';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { CategoriesService } from '../services/categories.service';
import { ProductsService } from '../services/products.service';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('categories')
export class CategoriesController {
  constructor(
    private categoriesServices: CategoriesService,
    private productsServices: ProductsService,
  ) {}

  @Is_PublicD()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Categories list',
  })
  async getCategories(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    // @Query('offset') offset = 10,
  ) {
    return { categories: await this.categoriesServices.findAll() };
  }

  //Getting obj params: Can use  Param() params: any and params.productId
  @Is_PublicD()
  @Get(':categoryId')
  @ApiOperation({
    summary: 'Get category by Id',
  })
  @HttpCode(HttpStatus.OK)
  async getCategory(
    @Res() res: Response,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return res.json({
      category: await this.categoriesServices.findOne(categoryId),
    });
  }

  @Post()
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async create(@Body() category: CreateCategoryDto) {
    return {
      message: 'Category created',
      product: await this.categoriesServices.create(category),
    };
  }

  @Put(':idCategory')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a category',
  })
  async update(
    @Res() res: Response,
    @Param('idCategory', ParseIntPipe) idCategory: number,
    @Body() category: UpdateCategoryDto,
  ) {
    const wasUpdated = await this.categoriesServices.update(
      idCategory,
      category,
    );
    if (wasUpdated) {
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Category updated', category: wasUpdated });
    } else {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: `Category ${idCategory} not updated` });
    }
  }

  @RoleD(Role.ADMIN)
  @Put(':idCategory/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'restore a category',
  })
  async restore(
    @Res() res: Response,
    @Param('idCategory', ParseIntPipe) idCategory: number,
  ) {
    const wasUpdated = await this.categoriesServices.restore(idCategory);
    if (wasUpdated?.affected > 0) {
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Category restored', category: wasUpdated });
    } else {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: `Category ${idCategory} not restored` });
    }
  }

  @RoleD(Role.ADMIN)
  @Delete(':idCategory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a category',
  })
  async delete(
    @Res() res: Response,
    @Param('idCategory', ParseIntPipe) idCategory: number,
  ) {
    await this.categoriesServices.remove(idCategory);
    return res
      .status(HttpStatus.OK)
      .json({ message: `Category ${idCategory} deleted` });
  }
}
