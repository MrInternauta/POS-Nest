import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Between, FindOptionsWhere, Repository } from 'typeorm';

import { CreateProductDto, UpdateProductDto } from '../../products/dtos/product.dto';
import { ProductsFilterDto } from '../dtos/productFilter.dto';
import { Product } from '../entities/product.entity';
import { CategoriesService } from './categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private categoryService: CategoriesService
  ) {}

  public async findAll(params?: ProductsFilterDto) {
    if (!params)
      return this.productRepo.find({
        relations: ['category'],
      });
    const where: FindOptionsWhere<Product> = {};
    const { limit, offset } = params;
    const { minPrice, maxPrice } = params;

    if (minPrice && maxPrice) {
      where.price = Between(minPrice, maxPrice);
    }

    if (params?.categoryId) {
      where.category = { id: params.categoryId };
    }

    const res = await this.productRepo.find({
      relations: ['category'],
      take: limit,
      skip: offset,
      where,
    });

    console.log(res);
    return res;
  }

  public async findOne(idProduct: number, whithRelations = true) {
    const product = await this.productRepo.findOne({
      relations: whithRelations ? ['category'] : [],
      where: { id: idProduct },
    });
    if (!product) {
      throw new NotFoundException(`Product ${idProduct} not found`);
    } else {
      return product;
    }
  }

  findOnebyName(name: string) {
    return this.productRepo.find({
      where: { name },
      take: 1,
      withDeleted: true,
    });
  }

  findOnebyCode(code: string) {
    return this.productRepo.find({
      where: { code },
      take: 1,
      withDeleted: true,
    });
  }

  async validateUniqueName(name: string) {
    const items = await this.findOnebyName(name);
    if (items && items.length > 0) {
      throw new BadRequestException(`Product with name '${name}' already exists`);
    }
  }

  async validateUniqueCode(code: string) {
    const items = await this.findOnebyCode(code);
    if (items && items.length > 0) {
      throw new BadRequestException(`Product with code '${code}' already exists`);
    }
  }

  public async create(payload: CreateProductDto) {
    try {
      await this.validateUniqueName(payload.name);
      await this.validateUniqueCode(payload?.code);

      const product = this.productRepo.create(payload);
      if (payload.categoryId) {
        const categories = await this.categoryService.findById(payload.categoryId);
        product.category = categories;
      }
      return this.productRepo.save(product);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  public async update(id: number, payload: UpdateProductDto) {
    try {
      if (payload?.name) {
        const productsItems = await this.findOnebyName(payload?.name);
        if (productsItems && productsItems.length > 0 && id.toString() !== productsItems[0].id?.toString()) {
          throw new BadRequestException(`Product with name '${payload?.name}' already exists`);
        }
      }

      let product = await this.findOne(id);
      if (payload?.categoryId) {
        const categories = await this.categoryService.findById(payload.categoryId);
        product.category = categories;
      }
      product = this.productRepo.merge(product, payload);
      return this.productRepo.save(product);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async withStock(productId: number, quantity: number) {
    const product = await this.findOne(productId, false);
    if (product.stock < quantity) {
      throw new BadRequestException(`Product ${product.name} without ${quantity} of stock, just ${product.stock}`);
    }
    return product;
  }

  async quitStock(productId: number, quantity: number) {
    const product = await this.findOne(productId, false);
    product.stock = product.stock - quantity;
    return this.productRepo.save(product);
  }
  async addStock(productId: number, quantity: number) {
    const product = await this.findOne(productId, false);
    product.stock = product.stock + quantity;
    return this.productRepo.save(product);
  }

  public async remove(id: number) {
    await this.findOne(id);
    return this.productRepo.softDelete({ id });
  }

  public async restore(id: number) {
    return this.productRepo.restore({ id });
  }

  defaultProducts() {
    const products = [
      ['7502241360163', 'VAPE INSECTICIDA', 200, 5],
      ['7501059292406', 'SOBRE NESCAFE DOLCA DE 10 GR.', 200, 9],
      ['7503013328053', 'ATRAPA MOSCAS CATCA MAX', 0, 1],
      ['66674815019', 'ATRAPA MOSCAS TRAPAMEX', 0, 1],
      ['7501059295193', 'NUTRI RINDES', 0, 22],
      ['750105129923', 'SOPA INSTANTANEA KNORR FIDEOS', 200, 18],
      ['750101835238', 'SOPA INSTANTANEA LA MODERNA ESTRELLA', 200, 18],
      ['750108315092', 'SOPA INSTANTANEA LA MODERNA FIDEOS', 200, 18],
      ['7501005190794', 'KNORR TOMATE 12 pz', 200, 4],
      ['7506192502689', 'RICO POLLO', 200, 4],
      ['750105199292', 'KNORR POLLO', 200, 4],
      ['7506205815867', 'CHOCO MILK', 200, 8],
      ['75058883', 'CERILLOS JAGUARES', 200, 3],
      ['75036553', 'CERILLOS CLASICOS', 200, 5],
      ['6973198989898', 'CUBRE BOCA', 200, 4],
      ['750107341173', 'CHOCOLATE ABUELITA', 200, 17],
      ['7501077400715', 'MASECA CHICA  570G', 0, 13],
      ['750102606869', 'ROSA VENUS BLANCO', 20, 11],
      ['7501026006661', 'ROSA VENUS ROSA', 200, 11],
      ['752121291088', 'JABONCITO', 200, 20],
      ['7506306245891', 'SAVILE', 200, 11],
      ['7501026005688', 'ZOTE 200G ROSA', 200, 16],
      ['7501026005381', 'ZOTE 200G BLANCO', 200, 16],
      ['7501026005985', 'ZOTE 100G ROSA', 200, 9],
      ['75025152032', 'JABON PRINCESA ROSA', 1, 15],
      ['7502251522025', 'JABON PRINCESA AZUL', 200, 15],
      ['7501077400050', 'Maseca 1KG', 200, 25],
      ['7503015181274', 'Leche flor de Mexico', 200, 18],
      ['604498702585', 'Leche vida blanca', 200, 18],
      ['604498415232', 'Leche Califonia', 200, 18],
      ['7502251520014', 'Harina sol de oro', 200, 25],
      ['7509546682570', 'Suavitel lila', 200, 26],
      ['7509546682594', 'Suavitel acqua', 200, 26],
      ['7509546051932', 'Axion 750', 200, 35],
      ['7501025403485', 'Pinol Grande', 200, 35],
      ['7501073411173', 'Chocolate Abuelita', 200, 17],
      ['011848455570', 'Achiote', 200, 15],
      ['7501020566994', 'Yomi lala chocolate', 200, 37],
      ['7501020567007', 'Yomi lala vainilla', 200, 37],
      ['7501020567014', 'Yomi lala fresa', 200, 37],
      ['011848245003', 'Vinagre Blanco', 200, 15],
      ['7501003127235', 'Salsa casera', 200, 13],
      ['7501008765012', 'Galletas cuétara chavalín', 200, 15],
      ['7500478005857', 'Bizcochito gamesa', 200, 15],
      ['7501144990019', 'Aceitunas en salmuera vermex', 200, 16],
      ['7501144990132', 'Alcaparras en vinagre', 200, 20],
      ['7501003150233', 'Mole doña maria', 200, 50], //registrar
      ['7501008769010', 'Galleta cuétara diavolín', 200, 15],
      ['7501058611062', 'Leche evaporada carnation', 200, 25],
      ['7501017042937', 'Frijoles negros refritos  la costeña', 200, 20],
      ['7501052420165', 'Frijoles negros refritos  la sierra', 200, 20],
      ['7501006559026', 'Palomitas mantequilla', 200],
      ['7501000664382', 'Galletas doradas gamesa', 20],
      ['7501000658923', 'Galletas marías gamesa', 20],
      ['7501003300676', 'Mostaza', 200],
      ['7509546017815', 'Suavitel chico aroma del sol', 1],
      ['7500478014477', 'Emperador piruetas', 20],
      ['75000608', 'Cloralex chico', 17],
      ['7500478013661', 'Emeperador sabor nuez', 20],
      ['7500478013647', 'Emperador sabor chocolate', 20],
      ['4501151205215', 'Vasos Bosco plastico 6oz 50pz', 1],
      ['7501000658329', 'Galletas marías azucaradas', 20],
      ['7502208805171', 'Platos charola 25pz', 1],
      ['038629002068', 'Galletas marianitas de coco la moderna', 20],
      ['7500478023608', 'Galletas maravillas gamesa', 20],
      ['752216092187', 'Plato termicos division 20pz jaguar', 1],
      ['724865034313', 'Galletas cremosas donde', 20],
      ['7501431283206', 'Plato termicos convermex 20pz', 1],
      ['9250774021072', 'Tenedor mediano jaguar 25pz', 2],
      ['752216085059', 'Tenedor mediano 25pz jaguar', 2],
      ['7501431248038', 'Cuchara sopera convermex 25pz', 4],
      ['7501431218031', 'Cuchara 14cm convermex 25pz', 3],
      ['7501431208032', 'Cuchara desechable chica convermex 50pz', 1],
      ['7501000664221', 'Saladitas gamesa', 20],
      ['7503032460055', 'Zuko sabor naranja', 20],
      ['7622210573216', 'Tang sabor limón', 20],
      ['7501069213972', 'Fecula de maiz tres estrellas 400g', 2],
      ['7503032460093', 'Zuko sabor horchata', 20],
      ['7622210572684', 'Tang sabor melón', 20],
      ['7501003100085', 'Mole doña maria 360g', 200, 30],
      ['7503032460185', 'Zuko sabor sandía', 20],
      ['7503032460123', 'Zuko sabor tamarindo', 20],
      ['7501069214061', 'Fecula de maiz tres estrellas 95g', 5],
      ['4503042460086', 'Zuko sabor uva', 20],
      ['7503032460109', 'Zuko sabor fresa', 20],
      ['7501052474069', 'Mermelada de fresa Clemente', 1],
      ['7503032460062', 'Zuko sabor jamaica', 20],
      ['7501000612147', 'Cremax sabor fresa', 20],
      ['7501200486005', 'Leche condensada pronto', 2],
      ['7501000612161', 'Cremax sabor vainilla', 20],
      ['7500463662102', 'Horchata de arroz 250ml El sabor de la sierra', 4],
      ['7501062702657', 'Chiles rellenos la morena 380g', 1],
      ['7501000612130', 'Cremax sabor chocolate', 20],
      ['070662141229', 'Nissin sabor camarón, habanero, limón', 20],
      ['070662140024', 'Nissin con camarón', 20],
      ['7501000111800', 'Pan tostado clásico', 10],
      ['7501000157075', 'Tostadas onduladas Milpa Real', 10],
      ['7500525102706', 'Arroz grano grande precissimo 1kg', 3],
      ['7501000122332', 'Pan blanco bimbo grande', 10],
      ['7501111100724', 'Arroz prima 500g', 7],
      ['7501000364695', 'Totopos del hogar', 10],
      ['7501030418399', 'Donitas espolvoreadas bimbo', 10],
      ['7501111100717', 'Arroz prima 250g', 12],
      ['7501030475521', 'Mantecadas bimbo sabor vainilla', 10],
      ['7500810018743', 'Madalenas bimbo 62g', 10],
      ['7501025431020', 'Flash lavanda 500ml', 14],
      ['7501030474227', 'Donas bimbo 6 p', 10],
      ['7501000112395', 'Rebanadas bimbo', 10],
      ['741120000067', 'Pinomax 500ml', 8],
      ['7501000112784', 'Nito bimbo', 10],
      ['7501030472698', 'Bimbuñuelos', 10],
      ['7501000116447', 'Bran frut', 2],
      ['7501000149100', 'Empanizado crujiente', 2],
      ['7501000111855', 'Pan molido clásico', 2],
      ['7501025403027', 'Pinol 500 ml', 200, 21],
      ['7501030427018', 'Tortillas del hogar 10 p', 3],
      ['7501025400170', 'Pinol aromas 500ml', 200, 23],
      ['7501030427018', 'Tortillas de harina del hogar 10p', 3],
      ['7501026004629', 'Detergente roma  250g', 18],
      ['7501006705942', 'Detergente ace 250g', 12],
      ['7501065908841', 'Detergente Ariel 250g', 12],
      ['7509546018911', 'Lavatrastes axion 250g', 1],
      ['7501030490272', 'Tortillinas tia rosa', 5],
      ['7501000140855', 'Triki-trakes', 2],
      ['7501018310103', 'Spaghetti la moderna 200g', 9],
      ['7503029151829', 'Plativolos', 2],
      ['7501000138944', 'Sponch', 2],
      ['327273744821', 'Sopa moño la moderna 200g', 8],
      ['7501000127344', 'Lors', 2],
      ['7501005199292', 'KNORR pollo 24pz', 48],
      ['7501030431190', 'Suavicremas sabor fresa 112g', 1],
      ['19732688', 'Suavicremas sabor chocolate', 2],
      ['7501030490951', 'Polvorones', 2],
      ['7501030491644', 'Canelitas', 2],
      ['7501000912605', 'Cafe dolca 22g.', 20],
      ['7501000153718', 'Bombonetes', 4],
      ['75002275', 'Chocoroles', 2],
      ['7501052472102', 'Salsa catsup Clemente 340g', 1],
      ['7501000153800', 'Pingüinos', 2],
      ['7501000153107', 'Gansito', 4],
      ['7501003300652', 'Mayonesa McCormick 105g', 16],
      ['7501003303394', 'Mayonesa McCormick 228g', 2],
      ['7501030418528', 'Triki-trakes maxitubo', 2],
      ['7501030418559', 'Polvorones maxitubo', 1],
      ['7501030457190', 'mini barritas maxitubo sabor fresa', 2],
      ['7503030374842', 'Sponch maxitubo', 3],
      ['7501052476063', 'Chiles jalapeños 105g', 16],
      ['7501030418542', 'Canelitas maxitubo', 1],
      ['7502224043557', 'Atun agua nair 120g', 5],
      ['7501030418504', 'Príncipe maxitubo', 2],
      ['7502224043564', 'Atun en aceite nair', 4],
      ['7501030418504', 'Lors maxitubo', 1],
      ['7501000153763', 'Rocko', 2],
      ['7501017004041', 'Vinagre Blanco la costeña 536ml', 1],
      ['7501011142299', 'Crujitos', 4],
      ['7501060500026', 'Aceite Patrona 500ml', 15],
      ['7500478016587', 'Churrumais con limoncito', 2],
      ['7501011155343', 'Cheetos palomitas', 4],
      ['7501011143586', 'Cheetos torciditos', 1],
      ['049190143753', 'Cheetos flamin hot', 3],
      ['7401001583517', 'Aceite purela 445ml', 20],
      ['7501011111028', 'Rancheritos', 3],
      ['7501005107013', 'Atole maizena chocolate', 5],
      ['7501011143999', 'Cheetos nacho', 1],
      ['7501005106979', 'Atole maizena vainilla', 5],
      ['7501011116252', 'Fritos sabor chile y limón', 4],
      ['7501011110335', 'Fritos sal y limón', 4],
      ['7501069210766', 'Harina de arroz tres estrellas 250g', 1],
      ['7501011123878', 'Doritos incógnita', 1],
      ['7501069213859', 'Atole tres estrellas chocolate', 5],
      ['7501069213842', 'Atole tres estrellas fresa', 5],
      ['7501017051298', 'Ensalada campesina la costeña 220g', 15],
      ['7501052471044', 'Elotes Clemente', 12],
      ['5507403127235', 'Salsa casera herdez', 30],
      ['7501020515299', 'Media crema lala', 12],
      ['7503015181076', 'Media crema delite', 12],
      ['7500435127486', 'Downy 360ml', 20],
      ['7501026006869', 'Venus Rosa', 12],
      ['7501728042974', 'Esponja Suprema', 5],
      ['7501026026577', 'Detergente foca 250g', 12],
      ['7501026027550', 'Jabol blanca nieves 250g', 12],
      ['7500435146678', 'Jabon liquido salvo 15ml', 12],
      ['7501035910072', 'Limpiador ajax', 5],
      ['666748119987', 'Fibra flexi', 5],
      ['7501728040529', 'Tendedero 10mt', 2],
      ['668148007000', 'Fibra de vidrio cometa', 5],
      ['7503010473312', 'Papel alumnio mega max modelo 10', 18],
      ['7501035911567', 'Colgate maxima proteccion', 3],
      ['7501018310752', 'Sopa moñito la moderna 200g', 6],
      ['7501018310035', 'Sopa fideos la moderna 200g', 6],
      ['6507011310523', 'Sopa coditos la moderna 200g', 6],
      ['7501018310561', 'Sopa Caracol 2  la moderna 200g', 6],
      ['7501011123380', 'Doritos pizzerola', 2],
      ['7501011163706', 'Doritos 3D', 2],
      ['034587090031', 'Sal Klara', 6],
      ['7501118341106', 'Sal sol 500g', 12],
      ['7503036904104', 'Maiz palomero 500g. De la abuela amada', 6],
      ['7591010502095', 'Ruffles original', 4],
      ['7501011104099', 'Ruffles queso', 2],
      ['7501791619882', 'Maiz bodega 500g.', 1],
      ['7500478019083', 'Avena  instantana quaker 288g', 6],
      ['7501379201522', 'Garbanzo 500g bueno', 1],
      ['7500525363213', 'Frijol precissimo', 2],
      ['7406171013697', 'Jaboncito de bolsa', 6],
      ['7501011123588', 'Doritos nachos', 3],
      ['7501011130272', 'Doritos xtra flamin hot', 3],
      ['7401001583500', 'Aceite purela175ml', 12],
      ['7501011101456', 'Sabritas original', 4],
      ['7401001583500', 'Salsa tipo inglesa crose', 6],
      ['9506083297593', 'Salsa maggi 45ml', 2],
      ['7501011118119', 'Sabritas crema y especies', 5],
      ['7501003393050', 'Salsa bufalo', 1],
      ['7501011101463', 'Sabritas adobadas', 3],
      ['011848425726', 'Salsa habanero la anita', 1],
      ['7501011143739', 'Sabritas flamin hot', 4],
      ['7501023318057', 'Chiles chipotle San marcos', 6],
      ['7501062700622', 'Chiles  chipotles la morena', 4],
      ['731082001004', 'Sardinas guaymex', 1],
      ['7501017005611', 'Pure de tomat la costeña', 12],
      ['7501079702817', 'Pure de tomate El fuerte', 12],
      ['7501011148963', 'Paketaxo mezcladito', 2],
      ['7501011114623', 'Paketaxo quexo', 1],
      ['7501011112438', 'Paketaxo botanero', 4],
      ['7501011144460', 'Paketaxo xtra flamin hot', 4],
      ['741113000012', 'Clarasol de 500ml', 40],
      ['7500810011508', 'Chips fuego', 2, '', '', 1],
    ];

    const defaultProduct: Array<CreateProductDto> = [];

    products.map(product => {
      defaultProduct.push({
        code: product[0].toString(),
        name: product[1].toString(),
        stock: Number(product[2]),
        image: '',
        price: Math.floor(Math.random() * 100) + 1,
        priceSell: Math.floor(Math.random() * 100) + 1,
        description: ' Lorem ipsum description',
        categoryId: null,
      });
    });
    return defaultProduct;
  }
}
