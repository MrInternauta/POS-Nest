import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { Response } from 'express';

import { CategoriesService } from '../products/services/categories.service';
import { ProductsService } from '../products/services/products.service';
import { RolesService } from '../users/services/roles.service';
import { UsersService } from '../users/services/users.service';
import { IMAGE_TYPES, ImageStorage, ImageType } from './image-storage';

const VALID_IMAGE_NAME = /^[A-Za-z0-9_-]+\.(png|jpe?g|gif)$/i;

@Injectable()
export class AppService {
  constructor(
    private rolesService: RolesService,
    private usersService: UsersService,
    private categoriesServices: CategoriesService,
    private productsServices: ProductsService,
    private imageStorage: ImageStorage
  ) {}

  async setDefaultValues() {
    try {
      const roles = this.rolesService.defaultValuesRole();
      //create permissions
      const permission_admin = await Promise.all(this.rolesService.createPermissions(roles.role_admin.permissions));

      const permission_vendor = await Promise.all(this.rolesService.createPermissions(roles.role_cashier.permissions));

      const permission_client = await Promise.all(this.rolesService.createPermissions(roles.role_client.permissions));

      const role_admin = await this.rolesService.create({
        name: roles.role_admin.name,
        permissions: permission_admin,
      });

      const role_cashier = await this.rolesService.create({
        name: roles.role_cashier.name,
        permissions: permission_vendor,
      });

      const role_client = await this.rolesService.create({
        name: roles.role_client.name,
        permissions: permission_client,
      });

      const users = this.usersService.defaultValuesUser();

      const admin = await this.usersService.create(users.admin);
      const cashier = await this.usersService.create(users.cashier);
      const client = await this.usersService.create(users.client);

      console.log(admin, cashier, client);

      admin.role = role_admin;
      await this.usersService.update(admin.id, admin);

      cashier.role = role_cashier;
      await this.usersService.update(cashier.id, cashier);

      client.role = role_client;
      await this.usersService.update(client.id, client);

      console.log(admin, cashier, client);

      //Settled, not fired and forgotten: the default list repeats a few codes, and an insert that
      //failed with nobody waiting for it brought the whole process down
      const categories = this.categoriesServices.defaultValue();
      await Promise.allSettled(categories.map(item => this.categoriesServices.create(item)));

      const products = this.productsServices.defaultProducts();
      await Promise.allSettled(products.map(item => this.productsServices.create(item)));
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
   * @description Envia la imagen guardada, o un 404 para que la app muestre su imagen por defecto
   * @param {Response} res Response de la petición HTTP
   * @returns {object} Retorna de respuesta al cliente en formato FILE
   */
  public async getImage(type: string, img: string, res: Response) {
    //Both values come from the url, so neither may point outside the images store
    if (!IMAGE_TYPES.includes(type as ImageType) || !VALID_IMAGE_NAME.test(img)) {
      throw new NotFoundException();
    }
    const image = await this.imageStorage.read(type as ImageType, img);
    if (!image) {
      throw new NotFoundException();
    }
    res.setHeader('Content-Type', image.contentType);
    //Every upload gets a new name, so a name always points at the same picture
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
    image.stream.on('error', () => res.destroy()).pipe(res);
  }

  public async updateImgeUser(id: number, file: Express.Multer.File) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new BadRequestException('User was not found');
    }
    const image = await this.replaceImage('user', id, user.image, file);
    const newUser = await this.usersService.update(Number(id), { ...user, image });
    delete newUser.password;
    return newUser;
  }

  public async updateImgeProduct(id: number, file: Express.Multer.File) {
    const product = await this.productsServices.findOne(id);
    if (!product) {
      throw new BadRequestException('Product was not found');
    }
    const image = await this.replaceImage('product', id, product.image, file);
    return this.productsServices.update(Number(id), { ...product, image });
  }

  imageValidations(file: Express.Multer.File) {
    const extension = this.extensionOf(file);

    // Extensiones permitidas
    const extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    if (extensionesValidas.indexOf(extension) < 0) {
      throw new BadRequestException('Las extensiones permitidas son ' + extensionesValidas.join(', '));
    }
  }

  /** Saves the new picture under a name of its own and drops the one it replaces */
  private async replaceImage(type: ImageType, id: number, previous: string, file: Express.Multer.File) {
    this.imageValidations(file);
    const name = `${id}-${Date.now()}.${this.extensionOf(file)}`;
    await this.imageStorage.save(type, name, file.buffer, file.mimetype);

    const oldName = previous?.split('?')[0];
    if (oldName && VALID_IMAGE_NAME.test(oldName)) {
      //A picture left behind costs storage, not correctness, so it never fails the upload
      await this.imageStorage.remove(type, oldName).catch(error => console.log(error));
    }
    return name;
  }

  private extensionOf(file: Express.Multer.File) {
    return file?.originalname?.split('.').pop()?.toLowerCase();
  }
}
