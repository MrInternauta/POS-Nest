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
import { isAdmin, PayloadToken } from '../../core/auth/models/token.model';
import { FilterDto } from '../../core/interfaces/filter.dto';
import { CreateOrderItemDto } from '../dtos/order-item.dto';
import { CreateOrderDto, UpdateOrderDto } from '../dtos/order.dto';
import { OrderService } from '../services/order.service';

@UseGuards(JwtAuthGuard, RolesGuard)
//Every route here: the guard now reads a controller's roles too, so cashiers are listed explicitly
@RoleD(Role.ADMIN, Role.CASHIER, Role.CUSTOMER)
@Controller('orders')
@ApiTags('orders')
export class OrdersController {
  constructor(private orderService: OrderService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Order List', description: 'The orders of whoever is asking' })
  async findAll(@Req() req: Request, @Query() params: FilterDto) {
    const user = req.user as PayloadToken;

    return { orders: await this.orderService.findAll(user.sub, params) };
  }

  @Get(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get One' })
  async findOne(@Req() req: Request, @Param('orderId', ParseIntPipe) orderId: number) {
    return { order: await this.orderService.findOne(orderId, true, ownerOf(req)) };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a order',
  })
  async create(@Req() req: Request, @Body() order: CreateOrderDto) {
    //A sale belongs to whoever makes it; only an admin may record one for someone else
    const owner = ownerOf(req);
    return {
      message: 'Order created',
      order: await this.orderService.create(owner === undefined ? order : { ...order, userId: owner }),
    };
  }

  //It hands the order to another user, which only an admin may do
  @Put(':orderId')
  @RoleD(Role.ADMIN)
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
  async addItem(
    @Req() req: Request,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() order: CreateOrderItemDto
  ) {
    return {
      message: 'Item added',
      item: await this.orderService.addItem(orderId, order, ownerOf(req)),
    };
  }

  @Delete(':orderId/item/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete item in order',
  })
  async deleteItem(
    @Req() req: Request,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('itemId', ParseIntPipe) itemId: number
  ) {
    const order = await this.orderService.removeItem(orderId, itemId, ownerOf(req));
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
  async delete(@Req() req: Request, @Param('orderId', ParseIntPipe) orderId: number) {
    const result = await this.orderService.remove(orderId, ownerOf(req));
    return {
      message: result.affected && result.affected > 0 ? 'Order deleted' : 'Order not deleted',
      order: result,
    };
  }
}

/** Whose orders the caller may touch: their own, or any of them for an admin (undefined) */
function ownerOf(req: Request): number | undefined {
  const user = req.user as PayloadToken;
  return isAdmin(user) ? undefined : Number(user?.sub);
}
