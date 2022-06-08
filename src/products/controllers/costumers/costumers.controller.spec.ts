import { Test, TestingModule } from '@nestjs/testing';
import { CostumersController } from './costumers.controller';

describe('CostumersController', () => {
  let controller: CostumersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CostumersController],
    }).compile();

    controller = module.get<CostumersController>(CostumersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
