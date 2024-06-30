import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

import { config } from '../config';
import { CategoriesService } from '../products/services/categories.service';
import { ProductsService } from '../products/services/products.service';
import { RolesService } from '../users/services/roles.service';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class AppService {
  constructor(
    private rolesService: RolesService,
    private usersService: UsersService,
    private categoriesServices: CategoriesService,
    private productsServices: ProductsService,
    @Inject(config.KEY) private configService: ConfigType<typeof config>
  ) {}

  async setDefaultValues() {
    try {
      const roles = this.rolesService.defaultValuesRole();
      //create permissions
      const permission_admin = await Promise.all(this.rolesService.createPermissions(roles.role_admin.permissions));

      const role_admin = await this.rolesService.create(roles.role_admin);
      const role_cashier = await this.rolesService.create(roles.role_cashier);
      const role_client = await this.rolesService.create(roles.role_client);

      //asign role-permission
      role_admin.permissions = permission_admin;
      role_cashier.permissions = permission_admin.filter(item => item.name !== 'Users');

      await this.rolesService.roleRepo.save(role_admin);
      await this.rolesService.roleRepo.save(role_cashier);

      const users = this.usersService.defaultValuesUser();
      const admin = await this.usersService.create({ ...users.admin, role: role_admin.id });
      const cashier = await this.usersService.create({ ...users.cashier, role: role_cashier.id });
      const client = await this.usersService.create({ ...users.client, role: role_client.id });

      console.log(admin, cashier, client);

      // admin.role = role_admin;
      // await this.usersService.update(admin.id, admin);

      // cashier.role = role_cashier;
      // await this.usersService.update(cashier.id, cashier);

      // client.role = role_client;
      // await this.usersService.update(client.id, client);

      const categories = this.categoriesServices.defaultValue();
      categories.map(async item => {
        await this.categoriesServices.create(item);
      });

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

  /**
   * @version 0.0.1
   * @function existImage
   * @description Verifica que la imagen exista o retorna una imagen por defecto
   * @param {Request} [req] Request de la petición HTTP
   * @param {Response} res Response de la petición HTTP
   * @returns {object} Retorna de respuesta al cliente en formato FILE
   */
  public async getImage(type = 'user', img: string, res: Response) {
    const pathImg = path.join(__dirname, `../../${this.configService.IMAGES_PATH}/${type}/${img}`);

    if (fs.existsSync(pathImg)) {
      res.sendFile(pathImg);
    } else {
      const noImagePath = path.join(
        __dirname,
        `../../${this.configService.IMAGES_PATH}` + `/${type}/` + 'no-image.jpg'
      );
      res.sendFile(noImagePath);
    }
  }

  public async updateImgeUser(id: number, res: Response, file) {
    try {
      this.imageValidations(file);
      const nombreCortado = file?.originalname.split('.');
      const extension = nombreCortado[nombreCortado.length - 1];
      const user = await this.usersService.findOne(id);
      if (!user) {
        throw new BadRequestException('User was not found');
      }
      const nombreArchivo = `${id}.${extension}`;
      this.removeFile(path.join(__dirname, `../../${this.configService.IMAGES_PATH}/${'user'}/${user?.image}`), 'user');

      const pathImagen = path.join(__dirname, `../../${this.configService.IMAGES_PATH}/${'user'}/${nombreArchivo}`);
      fs.writeFile(pathImagen, file.buffer, async err => {
        if (err) {
          throw new BadRequestException('Error al actualizar');
        }
        console.log('The file was saved!', pathImagen);
        const newUser = await this.usersService.update(Number(id), { ...user, image: nombreArchivo });
        delete newUser.password;
        res.json(newUser);
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException();
    }
  }

  public async updateImgeProduct(id: number, res: Response, file) {
    try {
      this.imageValidations(file);
      const nombreCortado = file?.originalname.split('.');
      const extension = nombreCortado[nombreCortado.length - 1];
      const product = await this.productsServices.findOne(id);
      if (!product) {
        throw new BadRequestException('Product was not found');
      }
      const nombreArchivo = `${id}.${extension}`;
      this.removeFile(
        path.join(__dirname, `../../${this.configService.IMAGES_PATH}/${'product'}/${product?.image}`),
        'product'
      );

      const pathImagen = path.join(__dirname, `../../${this.configService.IMAGES_PATH}/${'product'}/${nombreArchivo}`);

      fs.writeFile(pathImagen, file.buffer, async err => {
        if (err) {
          throw new BadRequestException('Error al actualizar');
        }
        console.log('The file was saved!', pathImagen);
        const newProduct = await this.productsServices.update(Number(id), { ...product, image: nombreArchivo });
        res.json(newProduct);
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException();
    }
  }

  imageValidations(file) {
    const nombreCortado = file?.originalname.split('.');
    const extension = nombreCortado[nombreCortado.length - 1];

    // Extensiones permitidas
    const extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    if (extensionesValidas.indexOf(extension) < 0) {
      throw new BadRequestException('Las extensiones permitidas son ' + extensionesValidas.join(', '));
    }
  }

  private removeFile(nameImage, type = 'user') {
    const pathImagen = path.join(__dirname, `../../${this.configService.IMAGES_PATH}/${type}/${nameImage}`);
    if (fs.existsSync(pathImagen)) {
      fs.unlinkSync(pathImagen);
    }
  }
}
