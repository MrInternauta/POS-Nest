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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { canManageStore, PayloadToken } from '../../core/auth/models/token.model';
import { FilterDto } from '../../core/interfaces/filter.dto';
import { Store } from '../../stores/entities/store.entity';
import { CurrentStore, StoreGuard } from '../../stores/guards/store.guard';
import { CreateOrderItemDto } from '../dtos/order-item.dto';
import { CreateOrderDto, UpdateOrderDto } from '../dtos/order.dto';
import { OrderService } from '../services/order.service';

//A cashier works with the sales they made; the owner with every sale of the store
@UseGuards(JwtAuthGuard, StoreGuard, RolesGuard)
@RoleD(Role.OWNER, Role.CASHIER)
@Controller('orders')
@ApiTags('orders')
export class OrdersController {
  constructor(private orderService: OrderService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Order List', description: 'The sales of whoever is asking, in the store being worked in' })
  async findAll(@CurrentStore() store: Store, @Req() req: Request, @Query() params: FilterDto) {
    const user = req.user as PayloadToken;
    return { orders: await this.orderService.findAll(store.id, Number(user.sub), params) };
  }

  @Get(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get One' })
  async findOne(@CurrentStore() store: Store, @Req() req: Request, @Param('orderId', ParseIntPipe) orderId: number) {
    return { order: await this.orderService.findOne(store.id, orderId, true, sellerOf(req)) };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a order', description: 'Recorded under whoever makes it' })
  async create(@CurrentStore() store: Store, @Req() req: Request, @Body() order: CreateOrderDto) {
    const user = req.user as PayloadToken;
    return {
      message: 'Order created',
      order: await this.orderService.create(store.id, Number(user.sub), order),
    };
  }

  //It hands the order to another member or customer, which only the owner may do
  @Put(':orderId')
  @RoleD(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a order' })
  async update(
    @CurrentStore() store: Store,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() order: UpdateOrderDto
  ) {
    return {
      message: 'Order updated',
      order: await this.orderService.update(store.id, orderId, order),
    };
  }

  @Post(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a item' })
  async addItem(
    @CurrentStore() store: Store,
    @Req() req: Request,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() order: CreateOrderItemDto
  ) {
    return {
      message: 'Item added',
      item: await this.orderService.addItem(store.id, orderId, order, sellerOf(req)),
    };
  }

  @Delete(':orderId/item/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete item in order' })
  async deleteItem(
    @CurrentStore() store: Store,
    @Req() req: Request,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('itemId', ParseIntPipe) itemId: number
  ) {
    const order = await this.orderService.removeItem(store.id, orderId, itemId, sellerOf(req));
    return {
      message: 'Item deleted',
      order,
    };
  }

  @Delete(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a order' })
  async delete(@CurrentStore() store: Store, @Req() req: Request, @Param('orderId', ParseIntPipe) orderId: number) {
    const result = await this.orderService.remove(store.id, orderId, sellerOf(req));
    return {
      message: result.affected && result.affected > 0 ? 'Order deleted' : 'Order not deleted',
      order: result,
    };
  }
}

/** Whose sales the caller may touch: their own, or any in the store for its owner (undefined) */
function sellerOf(req: Request): number | undefined {
  const user = req.user as PayloadToken;
  return canManageStore(user) ? undefined : Number(user?.sub);
}
