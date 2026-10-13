import {
  BadRequestException,
  ForbiddenException,
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import { Is_PublicD } from '../../core/auth/decorators/public.decorator';
import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { isAdmin, PayloadToken } from '../../core/auth/models/token.model';
import { FilterDto } from '../../core/interfaces/filter.dto';
import { UserDto } from '../dtos/user.dto';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Controller('users')
@ApiTags('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @RoleD(Role.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'User list',
    description: 'Get all users',
    parameters: [
      {
        name: 'page',
        description: 'Page number',
        in: 'query',
        required: false,
      },
      {
        name: 'limit',
        description: 'Limit of users per page',
        in: 'query',
        required: false,
      },
    ],
  })
  async findAll(@Query() params: FilterDto) {
    return { users: await this.usersService.findAll(params) };
  }

  //Anyone signed in may read their own profile; only an admin may read someone else's
  @Get(':userId')
  @ApiOperation({
    summary: 'Get user by Id',
  })
  async get(@Req() req: Request, @Param('userId', ParseIntPipe) id: number) {
    assertSelfOrAdmin(req.user as PayloadToken, id);
    return { user: await this.usersService.findOne(id) };
  }

  //Signing up is open, so whatever role the body names is dropped: every new account starts with
  //the default one, and only an admin can change it afterwards with PUT
  @Is_PublicD()
  @Post('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign up',
  })
  async createUser(@Body() payload: UserDto) {
    return {
      message: 'User created',
      user: await this.usersService.create({ ...payload, role: undefined }),
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RoleD(Role.ADMIN, Role.CASHIER, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Update an user',
    description: 'Anyone may update their own profile; only an admin may update someone else or change a role',
  })
  async update(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() payload: UpdateUserDto) {
    const caller = req.user as PayloadToken;
    assertSelfOrAdmin(caller, id);

    //The profile screen sends the user's own role back on every save, so it is ignored, not refused
    const role = payload.role as number | { id?: number } | undefined;
    const roleId = isAdmin(caller) ? (typeof role === 'object' ? role?.id : role) : undefined;

    const wasUpdated = await this.usersService.update(id, payload, roleId);
    if (!wasUpdated) {
      throw new BadRequestException('User not updated');
    }
    return {
      message: 'User updated',
      user: wasUpdated,
    };
  }

  @Delete(':id')
  @RoleD(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an user',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.delete(+id);
    return {
      message: `User ${id} deleted`,
    };
  }
}

/**
 * A 403 and not a 401: the app signs out on a 401, and asking for someone else's profile is not a
 * reason to lose the session
 */
function assertSelfOrAdmin(caller: PayloadToken, id: number) {
  if (!isAdmin(caller) && Number(caller?.sub) !== id) {
    throw new ForbiddenException('You can only see or change your own profile');
  }
}
