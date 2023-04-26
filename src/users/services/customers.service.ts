import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CreateCustomerDto, UpdateCustomerDto } from '../dtos/customer.dto';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(@InjectRepository(Customer) private customerRepo: Repository<Customer>) {}

  findAll() {
    return this.customerRepo.find({
      relations: ['orders'],
    });
  }

  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException(`Customer ${id} not found`);
    }
    const customer = await this.customerRepo.findOneBy({ id });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return customer;
  }

  create(data: CreateCustomerDto) {
    const newCustomer = this.customerRepo.create(data);
    return this.customerRepo.save(newCustomer);
  }

  async update(id: number, changes: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    this.customerRepo.merge(customer, changes);
    return this.customerRepo.save(customer);
  }

  async delete(id: number) {
    const customer = await this.customerRepo.findOneBy({ id });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return this.customerRepo.softDelete({ id });
  }
}
