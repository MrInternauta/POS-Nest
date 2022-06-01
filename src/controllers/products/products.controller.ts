import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
@Controller('products')
export class ProductsController {
  //First router with static path
  @Get('filter')
  getProductFilter() {
    return { message: `Soy filtro` };
  }

  //Params
  @Get(':productId')
  getProduct(@Param('productId') productId: string) {
    return { message: `Product: ${productId}` };
  }

  @Get('products2/:productId')
  getProduct2(@Param() params: any) {
    return { message: `Producto: ${params.productId}` };
  }
  //Query Params
  @Get()
  getproductsWithAnyParams(@Query() params: any) {
    return { message: `Page: ${params.page} and  limit: ${params.limit}` };
  }

  @Get('products2')
  getproducts(@Query('page') page = 1, @Query('limit') limit = 10) {
    return { message: `Page: ${page} and  limit: ${limit}` };
  }

  @Get('products3')
  getproducts2(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('offset') offset = 10,
  ) {
    return {
      message: `Page: ${page} and  limit: ${limit} and offset: ${offset}`,
    };
  }

  @Post()
  create(@Res() res: Response, @Body() product: any) {
    return res.status(HttpStatus.OK).json({
      message: 'Product created',
      product,
    });
  }
  @Put(':productId')
  update(
    @Res() res: Response,
    @Param('productId') productId: string,
    @Body() product: any,
  ) {
    return res.status(HttpStatus.OK).json({
      message: `Product updated: ${productId}`,
      product,
    });
  }
  @Delete(':productId')
  delete(@Res() res: Response, @Param('productId') productId: string) {
    res.status(HttpStatus.OK).json({
      message: `Product deleted: ${productId}`,
    });
  }
}
