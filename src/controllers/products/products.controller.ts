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
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ProductsService } from 'src/services/products.service';
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  //Getting obj query Params: @Query() params: any and params.limit
  @Get()
  @HttpCode(HttpStatus.OK)
  getProducts(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    // @Query('offset') offset = 10,
  ) {
    return { products: this.productsService.findAll(page, limit) };
  }

  //First router with static path
  @Get('filter')
  @HttpCode(HttpStatus.OK)
  getProductFilter(@Res() res: Response) {
    return res.json({ message: `Soy filtro` });
  }

  //Getting obj params: Can use  Param() params: any and params.productId
  @Get(':productId')
  @HttpCode(HttpStatus.OK)
  getProduct(
    @Res() res: Response,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const product = this.productsService.findOne(productId);
    if (!product) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: `Product with id ${productId} doesn't exists` });
    }
    return res.json({
      product,
    });
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() product: any) {
    return {
      message: 'Product created',
      product: this.productsService.create(product),
    };
  }

  @Put(':productId')
  update(
    @Res() res: Response,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() product: any,
  ) {
    const wasUpdated = this.productsService.update(productId, product);
    if (wasUpdated) {
      return res.status(HttpStatus.OK).json({
        message: `Product updated: ${productId}`,
        product: wasUpdated,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: `Can't update the product: ${productId}`,
      });
    }
  }

  //Use ParseIntPipe to parse the param to int (in the traspilation to JS)
  @Delete(':productId')
  delete(
    @Res() res: Response,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const wasDeleted = this.productsService.delete(productId);
    if (wasDeleted) {
      res.status(HttpStatus.OK).json({
        message: `Product deleted: ${productId}`,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: `Can't delete the product: ${productId}`,
      });
    }
  }
}
