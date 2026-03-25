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
    console.log('Processing transfer_initiated event:', data);

    try {
      await this.prisma.$transaction(async (tx) => {
        const sender = await tx.wallet.findUnique({
          where: { userId: data.senderId },
        });

        if (!sender || sender.balance < data.amount) {
          throw new BadRequestException(
            'Insufficient balance or sender not found',
          );
        }

        await tx.wallet.update({
          where: { userId: data.senderId },
          data: { balance: { decrement: data.amount } },
        });

        await tx.wallet.update({
          where: { userId: data.receiverId },
          data: { balance: { increment: data.amount } },
        });

        console.log(
          `Transfer from ${data.senderId} to ${data.receiverId} successful`,
        );
      });

      await firstValueFrom(
        this.client.emit('transfer_completed', { ...data, status: 'SUCCESS' }),
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Transfer failed:', errorMessage);
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
