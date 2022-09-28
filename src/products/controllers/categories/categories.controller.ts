import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { ParseIntPipe } from '../../../common/parse-int.pipe';
import { CreateCategoryDto, UpdateCategoryDto } from '../../dtos/category.dto';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';

@Controller('categories')
@ApiTags('categories')
export class CategoriesController {
  constructor(
    private categoriesServices: CategoriesService,
    private productsServices: ProductsService,
  ) {}

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
  @HttpCode(HttpStatus.OK)
  async create(@Body() category: CreateCategoryDto) {
    return {
      message: 'Category created',
      product: await this.categoriesServices.create(category),
    };
  }

  @Put(':idCategory')
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
