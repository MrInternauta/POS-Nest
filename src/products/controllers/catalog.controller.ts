import { Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CatalogFilterDto } from '../dtos/catalog-filter.dto';
import { ProductsService } from '../services/products.service';
import { StoresService } from '../../stores/services/stores.service';

/**
 * What a store shows to anyone, without a login: its name and contact, and the products it marked
 * public. Prices to the buyer only; no costs, stock counts or providers.
 */
@Controller('stores')
@ApiTags('catalog')
export class CatalogController {
  constructor(private storesService: StoresService, private productsService: ProductsService) {}

  @Get(':slug/catalog')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "A store's public catalogue" })
  async catalog(@Param('slug') slug: string, @Query() params: CatalogFilterDto) {
    const store = await this.storesService.findBySlug(slug);
    //A switched off store has no catalogue, the same as one that does not exist
    if (!store || !store.active) {
      throw new NotFoundException('Store not found');
    }

    const { products, total } = await this.productsService.findPublic(store.id, params);
    return {
      store: { name: store.name, slug: store.slug, phone: store.phone, address: store.address, logo: store.logo },
      products,
      total,
    };
  }
}
