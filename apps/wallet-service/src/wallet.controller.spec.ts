import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

describe('WalletController', () => {
  let walletController: WalletController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: {
            createWallet: jest.fn(),
            handleTransfer: jest.fn(),
          },
        },
      ],
    }).compile();

    walletController = module.get<WalletController>(WalletController);
  });

  it('should be defined', () => {
    expect(walletController).toBeDefined();
  });
});
