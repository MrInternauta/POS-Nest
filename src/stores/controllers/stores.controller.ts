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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import { RoleD } from '../../core/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Role } from '../../core/auth/models/roles.model';
import { PayloadToken } from '../../core/auth/models/token.model';
import { AuthService } from '../../core/auth/services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { AddMemberDto, UpdateMemberDto } from '../dtos/member.dto';
import { CreateStoreDto, UpdateStoreDto } from '../dtos/store.dto';
import { Store } from '../entities/store.entity';
import { CurrentStore, StoreGuard } from '../guards/store.guard';
import { StoresService } from '../services/stores.service';
import { TeamService } from '../services/team.service';

@Controller('stores')
@ApiTags('stores')
export class StoresController {
  constructor(
    private storesService: StoresService,
    private teamService: TeamService,
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  //Anyone signed in may open a store; they become its owner and get a token to work in it
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a store', description: 'Answers like a login, working in the new store' })
  async create(@Req() req: Request, @Body() dto: CreateStoreDto) {
    const caller = req.user as PayloadToken;
    const store = await this.storesService.createStore(Number(caller.sub), dto);
    const user = await this.usersService.findOne(Number(caller.sub));
    return this.authService.generateToken(user, store.id);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'The stores the user works in' })
  async mine(@Req() req: Request) {
    const memberships = await this.storesService.membershipsOf(Number((req.user as PayloadToken).sub));
    return {
      stores: memberships.map(({ store, role }) => ({ id: store.id, name: store.name, slug: store.slug, role })),
    };
  }

  @Get('current')
  @UseGuards(JwtAuthGuard, StoreGuard, RolesGuard)
  @RoleD(Role.OWNER, Role.CASHIER)
  @ApiOperation({ summary: 'The store being worked in' })
  current(@CurrentStore() store: Store) {
    return { store };
  }

  @Put('current')
  @UseGuards(JwtAuthGuard, StoreGuard, RolesGuard)
  @RoleD(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the store being worked in' })
  async update(@CurrentStore() store: Store, @Body() dto: UpdateStoreDto) {
    return { message: 'Store updated', store: await this.storesService.updateStore(store.id, dto) };
  }

  @Get('current/members')
  @UseGuards(JwtAuthGuard, StoreGuard, RolesGuard)
  @RoleD(Role.OWNER)
  @ApiOperation({ summary: 'Who works in the store' })
  async members(@CurrentStore() store: Store) {
    return { members: await this.storesService.members(store.id) };
  }

  @Post('current/members')
  @UseGuards(JwtAuthGuard, StoreGuard, RolesGuard)
  @RoleD(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add someone to the store',
    description: 'An existing account joins as it is; a new email gets an account with the temporary password given',
  })
  async addMember(@CurrentStore() store: Store, @Body() dto: AddMemberDto) {
    return { message: 'Member added', member: await this.teamService.addMember(store.id, dto) };
  }

  @Put('current/members/:memberId')
  @UseGuards(JwtAuthGuard, StoreGuard, RolesGuard)
  @RoleD(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Change someone's role in the store" })
  async changeRole(
    @CurrentStore() store: Store,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateMemberDto
  ) {
    await this.storesService.changeMemberRole(store.id, memberId, dto.role);
    return { message: 'Role changed' };
  }

  @Delete('current/members/:memberId')
  @UseGuards(JwtAuthGuard, StoreGuard, RolesGuard)
  @RoleD(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove someone from the store',
    description: 'Their account stays; they only stop working here',
  })
  async removeMember(@CurrentStore() store: Store, @Param('memberId', ParseIntPipe) memberId: number) {
    await this.storesService.removeMember(store.id, memberId);
    return { message: 'Member removed' };
  }
}
