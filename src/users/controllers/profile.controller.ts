import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { RoleD } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role } from '../../auth/models/roles.model';
import { PayloadToken } from '../../auth/models/token.model';
import { OrderService } from '../services/order.service';

@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {

  constructor(private orderService: OrderService) {}

  @RoleD(Role.CLIENT)
  @Get('my-orders')
  getOrders(@Req() req: Request) {
    const user = req.user as PayloadToken;
    return this.orderService.ordersByUserId(user.sub);
  }
}
