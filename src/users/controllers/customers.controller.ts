import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Is_PublicD } from '../../core/auth/decorators/public.decorator';
import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { CreateCustomerDto, UpdateCustomerDto } from '../dtos/customer.dto';
import { CustomersService } from '../services/customers.service';

@Controller('customers')
@ApiTags('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerController {
  constructor(private customersService: CustomersService) {}

  @RoleD(Role.ADMIN)
  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Is_PublicD() //@SetMetadata('isPublic', true)
  @Post()
  create(@Body() payload: CreateCustomerDto) {
    return this.customersService.create(payload);
  }

  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateCustomerDto) {
    return this.customersService.update(id, payload);
  }

  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.delete(+id);
  }
}
