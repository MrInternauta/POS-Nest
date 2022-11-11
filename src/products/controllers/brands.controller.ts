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
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { Is_PublicD } from '../../core/auth/decorators/public.decorator';
import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { CreateBrandDto, UpdateBrandDto } from '../dtos/brand.dto';
import { BrandsService } from '../services/brands.service';
import { ProductsService } from '../services/products.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@RoleD(Role.ADMIN)
@Controller('brands')
@ApiTags('Brands')
export class BrandsController {
  constructor(
    private brandService: BrandsService,
    private productsServices: ProductsService,
  ) {}

  @Is_PublicD()
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

  @Is_PublicD()
  @Get(':brandId')
  @ApiOperation({
    summary: 'Get product by Id',
  })
  @HttpCode(HttpStatus.OK)
  async getbrand(
    @Res() res: Response,
    @Param('brandId', ParseIntPipe) brandId: number,
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
      brand: await this.brandService.create(brand),
    };
  }

  @Is_PublicD()
  @Get(':brandId/products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get products by brandId',
  })
  async getProductsBybrandId(@Param('brandId', ParseIntPipe) brandId: number) {
    await this.brandService.findOne(brandId);
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

  @Put(':idBrand/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'restore a brand',
  })
  async restore(
    @Res() res: Response,
    @Param('idBrand', ParseIntPipe) idBrand: number,
  ) {
    const wasUpdated = await this.brandService.restore(idBrand);
    if (wasUpdated?.affected > 0) {
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Brand restored', product: wasUpdated });
    } else {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: `Brand ${idBrand} not restored` });
    }
  }

  @Delete(':idBrand')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a brand',
  })
  async delete(
    @Res() res: Response,
    @Param('idBrand', ParseIntPipe) idBrand: number,
  ) {
    await this.brandService.remove(idBrand);
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: `Brand ${idBrand} deleted`,
    });
  }
}
