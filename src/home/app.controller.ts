import {
  Controller,
  ForbiddenException,
  NotFoundException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Request, Response } from 'express';

import { Is_PublicD } from '../core/auth/decorators/public.decorator';
import { ApiKeyGuard } from '../core/auth/guards/api-key.guard';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { canManageStore, isSuperAdmin, PayloadToken } from '../core/auth/models/token.model';
import { StoresService } from '../stores/services/stores.service';
import { CustomUploadFileTypeValidator } from '../core/pipes/validator.pipe';
import { AppService } from './app.service';

const MAX_PROFILE_PICTURE_SIZE_IN_BYTES = 2 * 1024 * 1024;
const VALID_UPLOADS_MIME_TYPES = ['image/jpeg', 'image/png'];

@Controller()
@ApiTags('app')
export class AppController {
  constructor(private appService: AppService, private storesService: StoresService) {}
  @Is_PublicD()
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK) // 👈 Using decorator
  @Get('setDefaultValues')
  @ApiOperation({
    summary: 'Set values by default',
    description: 'set roles, users, categories and products',
    parameters: [
      {
        name: 'auth',
        description: 'Api key',
        in: 'header',
        required: true,
      },
    ],
  })
  async tasks() {
    return await this.appService.setDefaultValues();
  }

  //This controller has no guards of its own, so the upload used to take no login at all
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Upload image product or user',
    description:
      'A product picture takes the owner of the store being worked in, and a product of that store; a user picture, that user or a super admin',
  })
  @HttpCode(HttpStatus.OK) // 👈 Using decorator
  @Post('image/:type/:id')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: Request,
    @Param('type') type: 'user' | 'product',
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addValidator(
          new CustomUploadFileTypeValidator({
            fileType: VALID_UPLOADS_MIME_TYPES,
          })
        )
        .addMaxSizeValidator({ maxSize: MAX_PROFILE_PICTURE_SIZE_IN_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
    )
    file: Express.Multer.File
  ) {
    const caller = req.user as PayloadToken;
    if (type === 'product') {
      //The membership is read again, like StoreGuard does: the token alone could be out of date
      const { store, role } = await this.storesService.resolveAccess(caller);
      if (!canManageStore({ ...caller, storeRole: role })) {
        throw new ForbiddenException('Only the owner can change a product picture');
      }
      return this.appService.updateImgeProduct(store.id, id, file);
    }
    if (type === 'user') {
      if (!isSuperAdmin(caller) && Number(caller?.sub) !== id) {
        throw new ForbiddenException('You can only change your own picture');
      }
      return this.appService.updateImgeUser(id, file);
    }
    throw new NotFoundException();
  }

  //Served to anyone who has the file name, like before: no guard ever ran here
  @Get('image/:type/:img')
  @ApiOperation({
    summary: 'Get image product or user',
  })
  getImage(@Param('type') type: string, @Param('img') img: string, @Req() req: Request, @Res() res: Response) {
    return this.appService.getImage(type, img, res);
  }
}
