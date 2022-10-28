import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RoleD } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/models/roles.model';
import { CreateCustomerDto, UpdateCustomerDto } from '../dtos/customer.dto';
import { CustomersService } from '../services/customers.service';

@Controller('customers')
@ApiTags('customers')
export class CustomerController {
  constructor(private customersService: CustomersService) { }

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

  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @Post()
  create(@Body() payload: CreateCustomerDto) {
    return this.customersService.create(payload);
  }

  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, payload);
  }

  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.delete(+id);
  }
}
