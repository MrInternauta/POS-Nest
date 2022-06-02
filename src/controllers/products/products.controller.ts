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
  @Get()
  @HttpCode(HttpStatus.OK)
  getProducts(@Query('page') page = 1, @Query('limit') limit = 10) {
    return { products: this.productsService.findAll() };
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

  //First router with static path
  @Get('filter')
  @HttpCode(HttpStatus.OK)
  getProductFilter(@Res() res: Response) {
    return res.json({ message: `Soy filtro` });
  }

  //Params
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

  //Getting obj params
  // @Get('products2/:productId')
  // getProduct2(@Param() params: any) {
  //   return { message: `Producto: ${params.productId}` };
  // }

  //Getting obj query Params
  // @Get()
  // getproductsWithAnyParams(@Query() params: any) {
  //   return { message: `Page: ${params.page} and  limit: ${params.limit}` };
  // }

  @Post()
  create(@Res() res: Response, @Body() product: any) {
    return res.status(HttpStatus.OK).json({
      message: 'Product created',
      product: this.productsService.create(product),
    });
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
        product: wasUpdated,
      });
    }
  }

  // Los controladores tienen un fallo, sucede que el tipado funciona para la programación, pero al transpilarse sigue siendo JavaScript, por lo que los parámetros id siguen siendo strings y al operar con find en el array no retorna el objeto porque compara number === string, podemos evitar esto con los pipes de nestjs y la implementación quedaría así
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
