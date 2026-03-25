import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from './prisma.service';
import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: PrismaService;
  let clientMock: any;

  beforeEach(async () => {
    clientMock = {
      emit: jest.fn().mockReturnValue(of({})),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: {
            wallet: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn((cb) => cb(prisma)),
          },
        },
        {
          provide: 'TRANSACTION_SERVICE',
          useValue: clientMock,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('handleTransfer', () => {
    const transferData = {
      senderId: 'user1',
      receiverId: 'user2',
      amount: 100,
    };

    it('should fail if sender and receiver are the same', async () => {
      await service.handleTransfer({ ...transferData, receiverId: 'user1' });
      expect(clientMock.emit).toHaveBeenCalledWith('transfer_completed', expect.objectContaining({
        status: 'FAILED',
        reason: 'Sender and receiver cannot be the same',
      }));
    });

    it('should fail if sender wallet is not found', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValueOnce(null); // sender
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValueOnce({ userId: 'user2' }); // receiver

      await service.handleTransfer(transferData);
      expect(clientMock.emit).toHaveBeenCalledWith('transfer_completed', expect.objectContaining({
        status: 'FAILED',
        reason: 'Sender wallet not found',
      }));
    });

    it('should fail if receiver wallet is not found', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValueOnce({ userId: 'user1', balance: 1000 }); // sender
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValueOnce(null); // receiver

      await service.handleTransfer(transferData);
      expect(clientMock.emit).toHaveBeenCalledWith('transfer_completed', expect.objectContaining({
        status: 'FAILED',
        reason: 'Receiver wallet not found',
      }));
    });

    it('should fail if sender has insufficient balance', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValueOnce({ userId: 'user1', balance: 50 }); // sender
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValueOnce({ userId: 'user2', balance: 100 }); // receiver

      await service.handleTransfer(transferData);
      expect(clientMock.emit).toHaveBeenCalledWith('transfer_completed', expect.objectContaining({
        status: 'FAILED',
        reason: 'Insufficient balance',
      }));
    });

    it('should succeed if all conditions are met', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValueOnce({ userId: 'user1', balance: 1000 }); // sender
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValueOnce({ userId: 'user2', balance: 500 }); // receiver

      await service.handleTransfer(transferData);
      expect(prisma.wallet.update).toHaveBeenCalledTimes(2);
      expect(clientMock.emit).toHaveBeenCalledWith('transfer_completed', expect.objectContaining({
        status: 'SUCCESS',
      }));
    });
  });
});
