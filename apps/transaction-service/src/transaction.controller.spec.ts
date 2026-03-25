import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { PrismaService } from './prisma.service';

describe('TransactionController', () => {
  let transactionController: TransactionController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: {
            transactionRecord: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    transactionController = app.get<TransactionController>(TransactionController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(transactionController.getHello()).toBe('Hello World!');
    });
  });
});
