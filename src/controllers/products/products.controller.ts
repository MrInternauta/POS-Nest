import { Controller, Get, Param, Query } from '@nestjs/common';

@Controller('products')
export class ProductsController {
  //First router with static path
  @Get('filter')
  getProductFilter(): string {
    return `Soy filtro`;
  }

  //Params
  @Get(':productId')
  getProduct(@Param('productId') productId: string): string {
    return `Product: ${productId}`;
  }

  @Get('products2/:productId')
  getProduct2(@Param() params: any): string {
    return `Producto: ${params.productId}`;
  }
  //Query Params
  @Get()
  getproductsWithAnyParams(@Query() params: any): string {
    return `Page: ${params.page} and  limit: ${params.limit}`;
  }

  @Get('products2')
  getproducts(@Query('page') page = 1, @Query('limit') limit = 10): string {
    return `Page: ${page} and  limit: ${limit}`;
  }

  @Get('products3')
  getproducts2(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('offset') offset = 10,
  ): string {
    return `Page: ${page} and  limit: ${limit} and offset: ${offset}`;
  }
}
