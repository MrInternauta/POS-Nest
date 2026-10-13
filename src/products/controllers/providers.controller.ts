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
import { ProvidersService } from '../services/providers.service';

//Unlike categories nothing here is public: a provider carries contact details. RolesGuard only reads
//the role from the handler, so every route carries its own @RoleD
@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('providers')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Providers list' })
  async getProviders(@Query() params: FilterDto) {
    return { providers: await this.providersService.findAll(params) };
  }

  @Get(':providerId')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get provider by Id' })
  async getProvider(@Param('providerId', ParseIntPipe) providerId: number) {
    return { provider: await this.providersService.findOne(providerId) };
  }

  @Post()
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a provider' })
  async create(@Body() provider: CreateProviderDto) {
    return {
      message: 'Provider created',
      provider: await this.providersService.create(provider),
    };
  }

  @Put(':providerId')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a provider' })
  async update(@Param('providerId', ParseIntPipe) providerId: number, @Body() provider: UpdateProviderDto) {
    return {
      message: 'Provider updated',
      provider: await this.providersService.update(providerId, provider),
    };
  }

  @Put(':providerId/restore')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a provider' })
  async restore(@Param('providerId', ParseIntPipe) providerId: number) {
    const restored = await this.providersService.restore(providerId);
    if (!restored?.affected) {
      throw new BadRequestException(`Provider ${providerId} not restored`);
    }
    return { message: 'Provider restored' };
  }

  @Delete(':providerId')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a provider' })
  async delete(@Param('providerId', ParseIntPipe) providerId: number) {
    await this.providersService.remove(providerId);
    return { message: `Provider ${providerId} deleted` };
  }
}
