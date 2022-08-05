import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CreateBrandDto, UpdateBrandDto } from '../../dtos/brand.dto';
import { ProductsService } from '../../services/products.service';
import { BrandsService } from '../../services/brands.service';

@Controller('Brands')
@ApiTags('Brands')
export class BrandsController {
  constructor(
    private brandService: BrandsService,
    private productsServices: ProductsService,
  ) {}

  @Get()
  async getBrands(
    @Res() res: Response,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return res.status(HttpStatus.OK).json({
      brands: await this.brandService.findAll(),
    });
  }
  @Get(':brandId')
  @ApiOperation({
    summary: 'Get product by Id',
  })
  @HttpCode(HttpStatus.OK)
  async getbrand(
    @Res() res: Response,
    @Param('BrandId', ParseIntPipe) brandId: number,
  ) {
    return res.json({
      brand: await this.brandService.findOne(brandId),
    });
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() brand: CreateBrandDto) {
    return {
      message: 'Brand created',
      product: await this.brandService.create(brand),
    };
  }

  @Get(':brandId/products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get products by brandId',
  })
  getProductsBybrandId(@Param('BrandId') brandId: number) {
    return this.productsServices.findByBrand(brandId);
  }

  @Put(':idBrand')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a brand',
  })
  async update(
    @Res() res: Response,
    @Param('idBrand', ParseIntPipe) idBrand: number,
    @Body() brand: UpdateBrandDto,
  ) {
    const wasUpdated = await this.brandService.update(idBrand, brand);
    if (wasUpdated) {
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Brand updated', brand: wasUpdated });
    } else {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: `brand ${idBrand} not updated` });
    }
  }

  @Delete(':idBrand')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a brand',
  })
  async delete(@Res() res: Response, @Param('idBrand') idBrand: number) {
    const wasDeleted = await this.brandService.remove(idBrand);
    if (wasDeleted) {
      return res
        .status(HttpStatus.OK)
        .json({ message: `Brand ${idBrand} deleted` });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: `Brand ${idBrand} not deleted`,
      });
    }
  }
}
