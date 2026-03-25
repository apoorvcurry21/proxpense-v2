import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from './prisma.service';

@Injectable()
export class WalletService {
  constructor(
    @Inject('TRANSACTION_SERVICE') private readonly client: ClientProxy,
    private readonly prisma: PrismaService,
  ) {}

  async createWallet(userId: string, initialBalance: number) {
    return this.prisma.wallet.create({
      data: {
        userId,
        balance: initialBalance,
      },
    });
  }

  async handleTransfer(data: {
    senderId: string;
    receiverId: string;
    amount: number;
  }) {
    console.log('Processing transfer_initiated event:', JSON.stringify(data));

    try {
      if (data.senderId === data.receiverId) {
        throw new BadRequestException('Sender and receiver cannot be the same');
      }

      await this.prisma.$transaction(async (tx) => {
        console.log('Fetching sender wallet...', data.senderId);
        const sender = await tx.wallet.findUnique({
          where: { userId: data.senderId },
        });

        console.log('Fetching receiver wallet...', data.receiverId);
        const receiver = await tx.wallet.findUnique({
          where: { userId: data.receiverId },
        });

        if (!sender) {
          console.error(`Sender wallet not found: ${data.senderId}`);
          throw new BadRequestException('Sender wallet not found');
        }

        if (!receiver) {
          console.error(`Receiver wallet not found: ${data.receiverId}`);
          throw new BadRequestException('Receiver wallet not found');
        }

        console.log(`Current balances: S[${sender.balance}], R[${receiver.balance}], Amount[${data.amount}]`);

        if (sender.balance < data.amount) {
          console.error(`Insufficient balance: S[${sender.balance}] < ${data.amount}`);
          throw new BadRequestException('Insufficient balance');
        }

        console.log('Deducting from sender...');
        await tx.wallet.update({
          where: { userId: data.senderId },
          data: { balance: { decrement: data.amount } },
        });

        console.log('Adding to receiver...');
        await tx.wallet.update({
          where: { userId: data.receiverId },
          data: { balance: { increment: data.amount } },
        });

        console.log(
          `Transfer succeeded: ${data.senderId} -> ${data.receiverId}`,
        );
      });

      console.log('Emitting transfer_completed SUCCESS');
      await firstValueFrom(
        this.client.emit('transfer_completed', { ...data, status: 'SUCCESS' }),
      );
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      if (error instanceof BadRequestException) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Core Logic Error:', error);
      }

      console.error('Transfer failed final:', errorMessage);
      await firstValueFrom(
        this.client.emit('transfer_completed', {
          ...data,
          status: 'FAILED',
          reason: errorMessage,
        }),
      );
    }
  }

  async getWallet(userId: string) {
    return this.prisma.wallet.findUnique({
      where: { userId },
    });
  }
}
