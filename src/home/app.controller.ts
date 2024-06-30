import {
  Controller,
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

import { ApiKeyGuard } from '@project/auth';
import { Request, Response } from 'express';

import { RoleD } from '../core/auth/decorators/roles.decorator';
import { Role } from '../core/auth/models/roles.model';
import { CustomUploadFileTypeValidator } from '../core/pipes/validator.pipe';
import { AppService } from './app.service';

const MAX_PROFILE_PICTURE_SIZE_IN_BYTES = 2 * 1024 * 1024;
const VALID_UPLOADS_MIME_TYPES = ['image/jpeg', 'image/png'];

@Controller()
@ApiTags('app')
export class AppController {
  constructor(private appService: AppService) {}
  // @Is_PublicD()
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

  @RoleD(Role.ADMIN)
  @ApiOperation({
    summary: 'Upload image product or user',
  })
  @HttpCode(HttpStatus.OK) // 👈 Using decorator
  @Post('image/:type/:id')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('type') type: 'user' | 'product',
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
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
    file
  ) {
    if (type == 'product') {
      return this.appService.updateImgeProduct(id, res, file);
    } else {
      return this.appService.updateImgeUser(id, res, file);
    }
  }

  @Get('image/:type/:img')
  @RoleD(Role.ADMIN, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Get image product or user',
  })
  getImage(@Param('type') type: string, @Param('img') img: string, @Req() req: Request, @Res() res: Response) {
    return this.appService.getImage(type, img, res);
  }
}
