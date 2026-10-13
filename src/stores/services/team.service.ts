import { BadRequestException, Injectable } from '@nestjs/common';

import { UsersService } from '../../users/services/users.service';
import { AddMemberDto } from '../dtos/member.dto';
import { StoresService } from './stores.service';

/** Who works in a store. Lives apart from StoresService because it creates user accounts */
@Injectable()
export class TeamService {
  constructor(private storesService: StoresService, private usersService: UsersService) {}

  /**
   * Adds someone to the store. An email that already has an account just joins: the owner never
   * sets or learns the password of an account that already exists. A new email gets an account with
   * the temporary password the owner picked, to be changed with POST /auth/password.
   */
  async addMember(storeId: number, dto: AddMemberDto) {
    const email = dto.email.trim();
    let user = await this.usersService.findByEmail(email);

    if (user && !user.active) {
      throw new BadRequestException('This email cannot be added');
    }

    if (!user) {
      if (!dto.name?.trim() || !dto.password) {
        throw new BadRequestException('A new account needs a name and a temporary password');
      }
      user = await this.usersService.create({
        name: dto.name.trim(),
        lastName: dto.lastName?.trim() ?? '',
        phone: dto.phone?.trim() ?? '',
        image: '',
        email,
        password: dto.password,
      });
    }

    if (await this.storesService.isMember(storeId, user.id)) {
      throw new BadRequestException('This person already works in the store');
    }

    await this.storesService.addMember(storeId, user.id, dto.role);
    return (await this.storesService.members(storeId)).find(member => member.user.id === user.id);
  }
}
