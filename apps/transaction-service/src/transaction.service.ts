import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async createTransaction(data: {
    senderId: string;
    receiverId: string;
    amount: number;
    status: string;
  }) {
    return this.prisma.transactionRecord.create({
      data,
    });
  }

  async getTransactions(userId: string) {
    return this.prisma.transactionRecord.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
