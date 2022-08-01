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
} from '@nestjs/common';
import { Response } from 'express';

import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseIntPipe } from '../../../common/parse-int.pipe';
import { CategoriesService } from '../../services/categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../../dtos/category.dto';
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
    summary: 'Get product by Id',
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

  @Get(':categoryId/products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get products by catregoryId',
  })
  getProductsByCategoryId(@Param('categoryId') categoryId: number) {
    return this.productsServices.findByCategory(categoryId);
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

  @Delete(':idCategory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a category',
  })
  async delete(@Res() res: Response, @Param('idCategory') idCategory: number) {
    const wasDeleted = await this.categoriesServices.remove(idCategory);
    if (wasDeleted) {
      return res
        .status(HttpStatus.OK)
        .json({ message: `Category ${idCategory} deleted` });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: `Category ${idCategory} not deleted`,
      });
    }
  }
}
