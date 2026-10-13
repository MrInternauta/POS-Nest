import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleD } from '../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { Role } from '../core/auth/models/roles.model';
import { MonthlyDto, SummaryDto, TopProductsDto } from './dtos/reports.dto';
import { ReportsService } from './reports.service';

//RolesGuard reads the roles from the handler only, so each route carries its own @RoleD
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
@ApiTags('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('summary')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sales summary',
    description:
      'Revenue, profit, orders and average ticket so far this day/week/month, next to the same stretch of the previous one',
  })
  async summary(@Query() params: SummaryDto) {
    return { summary: await this.reportsService.summary(params.period) };
  }

  @Get('top-products')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Best-selling products for a date range' })
  async topProducts(@Query() params: TopProductsDto) {
    return { products: await this.reportsService.topProducts(params) };
  }

  @Get('monthly')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'One row per month, oldest first; months without sales come back as zero' })
  async monthly(@Query() params: MonthlyDto) {
    return { months: await this.reportsService.monthly(params.months) };
  }
}
