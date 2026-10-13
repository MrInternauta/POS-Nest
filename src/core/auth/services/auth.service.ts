import { Injectable } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';

import { StoresService } from '../../../stores/services/stores.service';
import { User } from '../../../users/entities/user.entity';
import { UsersService } from '../../../users/services/users.service';
import { PayloadToken } from '../models/token.model';

/** A store as the app lists it, with the user's role in it */
export interface StoreSummary {
  id: number;
  name: string;
  slug: string;
  role: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private storesService: StoresService
  ) {}

  async validateUser(userName: string, password: string) {
    const LOAD_ROLE = true;
    const user = await this.userService.findByEmail(userName, LOAD_ROLE);
    //A switched off account (a customer that used to have one) answers like a wrong password
    if (!user || !user.active) {
      throw new ForbiddenException('User or password wrong!');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ForbiddenException('User or password wrong!');
    }
    return user;
  }

  validateToken(token: string) {
    return this.jwtService.verify(token);
  }

  /**
   * A token for working in `storeId`, or in the user's first store when none is asked for. Without
   * any store (just signed up) the token carries none, and the app offers to create one.
   */
  async generateToken(user: User, storeId?: number) {
    const memberships = await this.storesService.membershipsOf(user.id);
    const stores: StoreSummary[] = memberships.map(({ store, role }) => ({
      id: store.id,
      name: store.name,
      slug: store.slug,
      role,
    }));

    let active: StoreSummary | null = stores[0] ?? null;
    if (storeId !== undefined) {
      //Refuses a store the user does not belong to, unless they are a super admin
      const { store, role } = await this.storesService.access(user.id, !!user.isSuperAdmin, storeId);
      active = { id: store.id, name: store.name, slug: store.slug, role };
    }

    const payload: PayloadToken = {
      sub: user.id,
      storeId: active?.id ?? null,
      storeRole: (active?.role as PayloadToken['storeRole']) ?? null,
      superAdmin: !!user.isSuperAdmin,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
      store: active,
      stores,
    };
  }
}
