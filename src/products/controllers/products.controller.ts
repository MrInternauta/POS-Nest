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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { FilterDto } from '../../core/interfaces/filter.dto';
import { ParseIntPipe } from '../../core/pipes/parse-int.pipe';
import { Store } from '../../stores/entities/store.entity';
import { CurrentStore, StoreGuard } from '../../stores/guards/store.guard';
import { CreateProductDto, UpdateProductDto } from '../dtos/product.dto';
import { ProductsFilterDto } from '../dtos/productFilter.dto';
import { ProductsService } from '../services/products.service';

/** A product list is text, a few thousand rows still fit well inside this */
const MAX_IMPORT_SIZE_IN_BYTES = 5 * 1024 * 1024;

//Everyone in the store sees the products, only its owner changes them. What a store shows
//outside the login is its public catalogue, GET /stores/:slug/catalog
@UseGuards(JwtAuthGuard, StoreGuard, RolesGuard)
@RoleD(Role.OWNER, Role.CASHIER)
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Products list',
    description: 'The products of the store being worked in',
    parameters: [
      { name: 'offset', description: 'Products to skip', in: 'query', required: false },
      { name: 'limit', description: 'Limit of products per page', in: 'query', required: false },
      {
        name: 'search',
        description: 'Free text matched against name, description and code',
        in: 'query',
        required: false,
      },
      { name: 'orderBy', description: 'Column to sort by, name by default', in: 'query', required: false },
      { name: 'order', description: 'ASC or DESC, ASC by default', in: 'query', required: false },
    ],
  })
  @HttpCode(HttpStatus.OK)
  async getProducts(@CurrentStore() store: Store, @Query() params: ProductsFilterDto & FilterDto) {
    const { products, total } = await this.productsService.findAll(store.id, params);
    return { products, total, limit: params?.limit, offset: params?.offset };
  }

  @RoleD(Role.OWNER)
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
  async importProducts(
    @CurrentStore() store: Store,
    @UploadedFile() file: { buffer?: Buffer; size?: number; originalname?: string }
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file was sent');
    }

    if (file.size > MAX_IMPORT_SIZE_IN_BYTES) {
      throw new BadRequestException('The file is too big');
    }

    return this.productsService.importFromCsv(store.id, file.buffer.toString('utf8'));
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get product by Id' })
  @HttpCode(HttpStatus.OK)
  async getProduct(@CurrentStore() store: Store, @Param('productId', ParseIntPipe) productId: number) {
    return { product: await this.productsService.findOne(store.id, productId) };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @RoleD(Role.OWNER)
  @ApiOperation({ summary: 'Create a product' })
  async create(@CurrentStore() store: Store, @Body() product: CreateProductDto) {
    return {
      message: 'Product created',
      product: await this.productsService.create(store.id, product),
    };
  }

  @Put(':productId')
  @HttpCode(HttpStatus.OK)
  @RoleD(Role.OWNER)
  @ApiOperation({ summary: 'Update a product' })
  async update(
    @CurrentStore() store: Store,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() product: UpdateProductDto
  ) {
    return {
      message: `Product updated: ${productId}`,
      product: await this.productsService.update(store.id, productId, product),
    };
  }

  @RoleD(Role.OWNER)
  @Put(':idProduct/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'restore an product' })
  async restore(@CurrentStore() store: Store, @Param('idProduct', ParseIntPipe) idProduct: number) {
    const restored = await this.productsService.restore(store.id, idProduct);
    if (!restored?.affected) {
      throw new BadRequestException(`Product ${idProduct} not restored`);
    }
    return { message: 'Product restored' };
  }

  @Delete(':productId')
  @RoleD(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product' })
  async delete(@CurrentStore() store: Store, @Param('productId', ParseIntPipe) productId: number) {
    await this.productsService.remove(store.id, productId);
    return { message: `Product ${productId} deleted` };
  }
}
