import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import { Is_PublicD } from '../../core/auth/decorators/public.decorator';
import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { PayloadToken } from '../../core/auth/models/token.model';
import { CreatePaymentDto, UpdateStoreSettingsDto } from '../dtos/payment.dto';
import { PaymentsService } from '../services/payments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
@ApiTags('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('options')
  @ApiOperation({ summary: 'Whether the checkout offers Mercado Pago next to cash' })
  async options() {
    return this.paymentsService.checkoutOptions();
  }

  @Get('settings')
  @RoleD(Role.ADMIN)
  @ApiOperation({ summary: 'Store payment settings' })
  async settings() {
    return { settings: await this.paymentsService.getSettings() };
  }

  @Put('settings')
  @RoleD(Role.ADMIN)
  @ApiOperation({ summary: 'Turn Mercado Pago on or off and choose the terminal' })
  async updateSettings(@Body() changes: UpdateStoreSettingsDto) {
    return { message: 'Settings updated', settings: await this.paymentsService.updateSettings(changes) };
  }

  @Get('terminals')
  @RoleD(Role.ADMIN)
  @ApiOperation({ summary: 'The Point terminals on the Mercado Pago account' })
  async terminals() {
    return { terminals: await this.paymentsService.listTerminals() };
  }

  /**
   * Mercado Pago calls this, so it has no login; the signature is what is checked. The id comes
   * from the query string (`data.id`), which is also the value Mercado Pago signs.
   */
  @Is_PublicD()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mercado Pago order notifications' })
  async webhook(
    @Query() query: Record<string, string>,
    @Body() body: { type?: string; data?: { id?: string } },
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string
  ) {
    const accepted = await this.paymentsService.handleWebhook(
      signature,
      requestId,
      query['data.id'] ?? body?.data?.id,
      query.type ?? body?.type
    );
    if (!accepted) {
      throw new UnauthorizedException();
    }
    return { received: true };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save the sale as pending and send the charge to the terminal' })
  async charge(@Req() req: Request, @Body() payment: CreatePaymentDto) {
    return { payment: await this.paymentsService.charge(req.user as PayloadToken, payment.items) };
  }

  @Get(':saleId')
  @ApiOperation({ summary: 'Where the charge stands' })
  async status(@Req() req: Request, @Param('saleId', ParseIntPipe) saleId: number) {
    return { payment: await this.paymentsService.status(req.user as PayloadToken, saleId) };
  }

  @Post(':saleId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a charge the customer has not paid yet' })
  async cancel(@Req() req: Request, @Param('saleId', ParseIntPipe) saleId: number) {
    return { payment: await this.paymentsService.cancel(req.user as PayloadToken, saleId) };
  }
}
