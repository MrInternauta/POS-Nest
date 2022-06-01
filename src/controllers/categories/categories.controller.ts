import { Controller, Get, Param } from '@nestjs/common';

@Controller('categories')
export class CategoriesController {
  @Get(':categoryId/products/:productId')
  getCategoryandProduct(
    @Param('categoryId') categoryId: string,
    @Param('productId') productId: string,
  ): string {
    return `Product: ${productId} and  Category: ${categoryId}`;
  }
}
