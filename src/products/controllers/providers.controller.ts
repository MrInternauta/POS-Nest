import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { ParseIntPipe } from '../../core/pipes/parse-int.pipe';
import { CreateProviderDto, UpdateProviderDto } from '../dtos/provider.dto';
import { Store } from '../../stores/entities/store.entity';
import { CurrentStore, StoreGuard } from '../../stores/guards/store.guard';
import { ProvidersService } from '../services/providers.service';

//Only the store's owner: a provider carries contact details
@Controller('providers')
@UseGuards(JwtAuthGuard, StoreGuard, RolesGuard)
@RoleD(Role.OWNER)
@ApiTags('providers')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Providers list' })
  async getProviders(@CurrentStore() store: Store, @Query() params: FilterDto) {
    return { providers: await this.providersService.findAll(store.id, params) };
  }

  @Get(':providerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get provider by Id' })
  async getProvider(@CurrentStore() store: Store, @Param('providerId', ParseIntPipe) providerId: number) {
    return { provider: await this.providersService.findOne(store.id, providerId) };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a provider' })
  async create(@CurrentStore() store: Store, @Body() provider: CreateProviderDto) {
    return {
      message: 'Provider created',
      provider: await this.providersService.create(store.id, provider),
    };
  }

  @Put(':providerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a provider' })
  async update(
    @CurrentStore() store: Store,
    @Param('providerId', ParseIntPipe) providerId: number,
    @Body() provider: UpdateProviderDto
  ) {
    return {
      message: 'Provider updated',
      provider: await this.providersService.update(store.id, providerId, provider),
    };
  }

  @Put(':providerId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a provider' })
  async restore(@CurrentStore() store: Store, @Param('providerId', ParseIntPipe) providerId: number) {
    const restored = await this.providersService.restore(store.id, providerId);
    if (!restored?.affected) {
      throw new BadRequestException(`Provider ${providerId} not restored`);
    }
    return { message: 'Provider restored' };
  }

  @Delete(':providerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a provider' })
  async delete(@CurrentStore() store: Store, @Param('providerId', ParseIntPipe) providerId: number) {
    await this.providersService.remove(store.id, providerId);
    return { message: `Provider ${providerId} deleted` };
  }
}
