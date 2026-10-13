import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { StoreStatusDto } from '../dtos/store-status.dto';
import { StoresService } from '../services/stores.service';

//The platform's view of every store. Entering one is POST /auth/switch, which a super admin may do anywhere
@Controller('admin/stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@RoleD(Role.SUPER_ADMIN)
@ApiTags('admin')
export class AdminStoresController {
  constructor(private storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'Every store, with its members count and owners' })
  list(@Query() params: FilterDto) {
    return this.storesService.listAll(params);
  }

  @Put(':storeId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch a store on or off' })
  async setStatus(@Param('storeId', ParseIntPipe) storeId: number, @Body() dto: StoreStatusDto) {
    return {
      message: dto.active ? 'Store on' : 'Store off',
      store: await this.storesService.setActive(storeId, dto.active),
    };
  }
}
