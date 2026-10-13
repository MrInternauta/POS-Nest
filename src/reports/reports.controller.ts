import { Controller, Get, HttpCode, HttpStatus, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';

import { RoleD } from '../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { Role } from '../core/auth/models/roles.model';
import { MonthlyDto, SummaryDto, TopProductsDto } from './dtos/reports.dto';
import { buildReportDocument, renderPdf } from './pdf/report-pdf';
import { ReportsService, storeDate } from './reports.service';

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

  @Get('product-insights')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Products worth a look',
    description:
      'Selling at or below cost, with stock but no sales in the last 30 days, running out within 7 days at the ' +
      'current pace, and missing a category, provider, image or description. Each group lists the worst 10 and ' +
      'counts all of them',
  })
  async productInsights() {
    return { insights: await this.reportsService.productInsights() };
  }

  @Get('pdf')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiProduces('application/pdf')
  @ApiOperation({
    summary: 'Sales report as a PDF',
    description: 'The summary of the period, the last 12 months, the best sellers and the stock to reorder, in spanish',
  })
  async pdf(@Query() params: SummaryDto) {
    const data = await this.reportsService.reportData(params.period);
    const file = await renderPdf(buildReportDocument(data));
    const day = storeDate(new Date(data.summary.current.to));

    return new StreamableFile(file, {
      type: 'application/pdf',
      disposition: `attachment; filename="reporte-${params.period}-${day}.pdf"`,
      length: file.length,
    });
  }
}
