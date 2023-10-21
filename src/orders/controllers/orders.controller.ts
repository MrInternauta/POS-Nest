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
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { FilterDto } from '../../core/interfaces/filter.dto';
import { CreateOrderItemDto } from '../dtos/order-item.dto';
import { CreateOrderDto, UpdateOrderDto } from '../dtos/order.dto';
import { OrderService } from '../services/order.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@RoleD(Role.ADMIN, Role.CUSTOMER)
@Controller('orders')
@ApiTags('orders')
export class OrdersController {
  constructor(private orderService: OrderService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Order List' })
  async findAll(@Query() params: FilterDto) {
    return { orders: await this.orderService.findAll(params) };
  }

  @Get(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get One' })
  async findOne(@Param('orderId', ParseIntPipe) orderId: number) {
    return { order: await this.orderService.findOne(orderId, true) };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a order',
  })
  async create(@Body() order: CreateOrderDto) {
    return {
      message: 'Order created',
      order: await this.orderService.create(order),
    };
  }

  @Put(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a order',
  })
  async update(@Param('orderId', ParseIntPipe) orderId: number, @Body() order: UpdateOrderDto) {
    return {
      message: 'Order updated',
      order: await this.orderService.update(orderId, order),
    };
  }

  @Post(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add a item',
  })
  async addItem(@Param('orderId', ParseIntPipe) orderId: number, @Body() order: CreateOrderItemDto) {
    return {
      message: 'Item added',
      item: await this.orderService.addItem(orderId, order),
    };
  }

  @Delete(':orderId/item/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete item in order',
  })
  async deleteItem(@Param('orderId', ParseIntPipe) orderId: number, @Param('itemId', ParseIntPipe) itemId: number) {
    const order = await this.orderService.removeItem(orderId, itemId);
    return {
      message: 'Item deleted',
      order,
    };
  }

  @Delete(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a order',
  })
  async delete(@Param('orderId', ParseIntPipe) orderId: number) {
    const result = await this.orderService.remove(orderId);
    return {
      message: result.affected && result.affected > 0 ? 'Order deleted' : 'Order not deleted',
      order: result,
    };
  }
}
