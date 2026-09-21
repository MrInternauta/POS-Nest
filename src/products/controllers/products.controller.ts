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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Response } from 'express';

import { Is_PublicD } from '../../core/auth/decorators/public.decorator';
import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { FilterDto } from '../../core/interfaces/filter.dto';
import { ParseIntPipe } from '../../core/pipes/parse-int.pipe';
import { CreateProductDto, UpdateProductDto } from '../dtos/product.dto';
import { ProductsFilterDto } from '../dtos/productFilter.dto';
import { ProductsService } from '../services/products.service';

/** A product list is text, a few thousand rows still fit well inside this */
const MAX_IMPORT_SIZE_IN_BYTES = 5 * 1024 * 1024;

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  //Getting obj query Params: @Query() params: any and params.limit
  @Get()
  @Is_PublicD()
  @ApiOperation({
    summary: 'Products list',
    description: 'Get all products',
    parameters: [
      {
        name: 'offset',
        description: 'Products to skip',
        in: 'query',
        required: false,
      },
      {
        name: 'limit',
        description: 'Limit of products per page',
        in: 'query',
        required: false,
      },
      {
        name: 'search',
        description: 'Free text matched against name, description and code',
        in: 'query',
        required: false,
      },
      {
        name: 'orderBy',
        description: 'Column to sort by, name by default',
        in: 'query',
        required: false,
      },
      {
        name: 'order',
        description: 'ASC or DESC, ASC by default',
        in: 'query',
        required: false,
      },
    ],
  })
  @HttpCode(HttpStatus.OK)
  async getProducts(
    @Query() params: ProductsFilterDto & FilterDto
    // @Query('offset') offset = 10,
  ) {
    const { products, total } = await this.productsService.findAll(params);
    return { products, total, limit: params?.limit, offset: params?.offset };
  }

  @RoleD(Role.ADMIN)
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Import a product list',
    description:
      'Takes a CSV and leaves the catalogue matching it: a code already in the table is updated, ' +
      'a code that is not there is created. Columns are matched by name in spanish or english: ' +
      'Codigo, Producto, Stock, Precio (the selling price), and optionally Precio de compra and ' +
      'Descripcion. A row that cannot be read is reported and the rest of the file still goes in.',
  })
  @HttpCode(HttpStatus.OK)
  async importProducts(@UploadedFile() file: { buffer?: Buffer; size?: number; originalname?: string }) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file was sent');
    }

    if (file.size > MAX_IMPORT_SIZE_IN_BYTES) {
      throw new BadRequestException('The file is too big');
    }

    return this.productsService.importFromCsv(file.buffer.toString('utf8'));
  }

  //First router with static path
  @Get('filter')
  @Is_PublicD()
  @ApiOperation({
    summary: 'A static path',
    description: 'First router with static path.\nEvite hit with parameter path :productId',
  })
  @HttpCode(HttpStatus.OK)
  getProductFilter() {
    return { message: `I'm a filter` };
  }

  //Getting obj params: Can use  Param() params: any and params.productId
  @Get(':productId')
  @Is_PublicD()
  @ApiOperation({
    summary: 'Get product by Id',
  })
  @HttpCode(HttpStatus.OK)
  async getProduct(@Res() res: Response, @Param('productId', ParseIntPipe) productId: number) {
    res.json({
      product: await this.productsService.findOne(productId),
    });
  }

  @Get(':productCode')
  @Is_PublicD()
  @ApiOperation({
    summary: 'Get product by productCode',
  })
  @HttpCode(HttpStatus.OK)
  async getProductByCode(@Param('productCode') productCode: string) {
    return {
      product: await this.productsService.findOnebyCode(productCode),
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @RoleD(Role.ADMIN)
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
  @RoleD(Role.ADMIN)
  @ApiOperation({
    summary: 'Update a product',
  })
  async update(@Param('productId', ParseIntPipe) productId: number, @Body() product: UpdateProductDto) {
    const wasUpdated = await this.productsService.update(productId, product);
    if (wasUpdated) {
      return {
        message: `Product updated: ${productId}`,
        product: wasUpdated,
      };
    } else {
      return {
        message: `Product ${productId} not updated`,
      };
    }
  }

  @RoleD(Role.ADMIN)
  @Put(':idProduct/restore')
  @ApiOperation({
    summary: 'restore an product',
  })
  async restore(@Res() res: Response, @Param('idProduct', ParseIntPipe) idProduct: number) {
    const wasUpdated = await this.productsService.restore(idProduct);
    if (wasUpdated?.affected > 0) {
      res.status(HttpStatus.OK).json({ message: 'Product restored', product: wasUpdated });
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({ message: `Product ${idProduct} not restored` });
    }
  }

  //Use ParseIntPipe to parse the param to int (in the traspilation to JS)
  @Delete(':productId')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a product',
  })
  async delete(@Param('productId', ParseIntPipe) productId: number) {
    await this.productsService.remove(productId);
    return {
      message: `Product ${productId} deleted`,
    };
  }
}
