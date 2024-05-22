import { BadRequestException, Injectable } from '@nestjs/common';

import { CategoriesService } from '../products/services/categories.service';
import { ProductsService } from '../products/services/products.service';
// import { ConfigService, ConfigType } from '@nestjs/config';
// import { config } from './config';
// import { Client } from 'pg';
import { RolesService } from '../users/services/roles.service';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class AppService {
  constructor(
    private rolesService: RolesService,
    private usersService: UsersService,
    private categoriesServices: CategoriesService,
    private productsServices: ProductsService
  ) {
    // @Inject(config.KEY) private configService: ConfigType<typeof config>,
    // @Inject('MyAsync') private tasks: any[],
    // @Inject('API_KEY') private apiKey: string,
    // // @Inject('DB_CONNECTION') private dbClient: Client,
    // private configSer: ConfigService,
    // console.log(this.configSer.get<string>('API_KEY'));
    // console.log(this.configSer.get<string>('DATA_BASE'));
    // console.log('Config: ', this.configService.api_key);
  }

  async setDefaultValues() {
    try {
      // const roles = this.rolesService.defaultValuesRole();
      // //create permissions
      // const permission_admin = await Promise.all(this.rolesService.createPermissions(roles.role_admin.permissions));

      // const role_admin = await this.rolesService.create(roles.role_admin);
      // const role_cashier = await this.rolesService.create(roles.role_cashier);
      // const role_client = await this.rolesService.create(roles.role_client);

      // //asign role-permission
      // role_admin.permissions = permission_admin;
      // role_cashier.permissions = permission_admin.filter(item => item.name !== 'Users');

      // await this.rolesService.roleRepo.save(role_admin);
      // await this.rolesService.roleRepo.save(role_cashier);

      // const users = this.usersService.defaultValuesUser();
      // const admin = await this.usersService.create(users.admin);
      // const cashier = await this.usersService.create(users.cashier);
      // const client = await this.usersService.create(users.client);

      // admin.role = role_admin;
      // await this.usersService.update(admin.id, admin);

      // cashier.role = role_cashier;
      // await this.usersService.update(cashier.id, cashier);

      // client.role = role_client;
      // await this.usersService.update(client.id, client);

      const products = this.productsServices.defaultProducts();
      products.map(async item => {
        await this.productsServices.create(item);
      });
      return {
        message: 'Values set successfully!',
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Values already set');
    }
  }
}
