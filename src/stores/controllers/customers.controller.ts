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
import { CreateCustomerDto, CustomerFilterDto, UpdateCustomerDto } from '../dtos/customer.dto';
import { Store } from '../entities/store.entity';
import { CurrentStore, StoreGuard } from '../guards/store.guard';
import { StoresService } from '../services/stores.service';

//Who the store sells to, for reference: cashiers pick and add them at the till, the owner also removes
@Controller('customers')
@UseGuards(JwtAuthGuard, StoreGuard, RolesGuard)
@RoleD(Role.OWNER, Role.CASHIER)
@ApiTags('customers')
export class CustomersController {
  constructor(private storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: "The store's customers", description: 'The default customer first' })
  list(@CurrentStore() store: Store, @Query() params: CustomerFilterDto) {
    return this.storesService.customers(store.id, params);
  }

  @Get(':customerId')
  async get(@CurrentStore() store: Store, @Param('customerId', ParseIntPipe) customerId: number) {
    return { customer: await this.storesService.findCustomer(store.id, customerId) };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@CurrentStore() store: Store, @Body() dto: CreateCustomerDto) {
    return { message: 'Customer created', customer: await this.storesService.addCustomer(store.id, dto) };
  }

  @Put(':customerId')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentStore() store: Store,
    @Param('customerId', ParseIntPipe) customerId: number,
    @Body() dto: UpdateCustomerDto
  ) {
    return {
      message: 'Customer updated',
      customer: await this.storesService.updateCustomer(store.id, customerId, dto),
    };
  }

  @Delete(':customerId')
  @RoleD(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a customer', description: 'Their past sales keep them; the default one stays' })
  async remove(@CurrentStore() store: Store, @Param('customerId', ParseIntPipe) customerId: number) {
    await this.storesService.removeCustomer(store.id, customerId);
    return { message: `Customer ${customerId} deleted` };
  }
}
