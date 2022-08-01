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
import { ParseIntPipe } from '../../../common/parse-int.pipe';
import { CreateProductDto, UpdateProductDto } from '../../dtos/product.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../../services/products.service';
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  //Getting obj query Params: @Query() params: any and params.limit
  @Get()
  @ApiOperation({
    summary: 'Products list',
    description: 'Get all products',
    parameters: [
      {
        name: 'page',
        description: 'Page number',
        in: 'query',
        required: false,
      },
      {
        name: 'limit',
        description: 'Limit of products per page',
        in: 'query',
        required: false,
      },
    ],
  })
  @HttpCode(HttpStatus.OK)
  async getProducts(
    @Query('page') page,
    @Query('limit') limit,
    // @Query('offset') offset = 10,
  ) {
    return { products: await this.productsService.findAll(page, limit) };
  }

  //First router with static path
  @Get('filter')
  @ApiOperation({
    summary: 'A static path',
    description:
      'First router with static path.\nEvite hit with parameter path :productId',
  })
  @HttpCode(HttpStatus.OK)
  getProductFilter(@Res() res: Response) {
    return res.json({ message: `I'm a filter` });
  }

  //Getting obj params: Can use  Param() params: any and params.productId
  @Get(':productId')
  @ApiOperation({
    summary: 'Get product by Id',
  })
  @HttpCode(HttpStatus.OK)
  async getProduct(
    @Res() res: Response,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return res.json({
      product: await this.productsService.findOne(productId),
    });
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a product',
  })
  async create(@Body() product: CreateProductDto) {
    return {
      message: 'Product created',
      product: await this.productsService.create(product),
    };
  }

  @Put(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a product',
  })
  async update(
    @Res() res: Response,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() product: UpdateProductDto,
  ) {
    const wasUpdated = await this.productsService.update(productId, product);
    if (wasUpdated) {
      return res.status(HttpStatus.OK).json({
        message: `Product updated: ${productId}`,
        product: wasUpdated,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: `Product ${productId} not updated`,
      });
    }
  }

  //Use ParseIntPipe to parse the param to int (in the traspilation to JS)
  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a product',
  })
  async delete(
    @Res() res: Response,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    try {
      await this.productsService.remove(productId);
      res.status(HttpStatus.OK).json({
        message: `Product ${productId} deleted`,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: `Product: ${productId} not deleted`,
      });
    }
  }
}
