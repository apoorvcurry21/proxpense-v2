import { Controller, Get, Param } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  getHello(): string {
    return this.transactionService.getHello();
  }

  @Get('transactions/:userId')
  async getTransactions(@Param('userId') userId: string) {
    return this.transactionService.getTransactions(userId);
  }

  @EventPattern('transfer_completed')
  async handleTransferCompleted(@Payload() data: any) {
    const transaction = await this.transactionService.createTransaction({
      senderId: data.senderId,
      receiverId: data.receiverId,
      amount: data.amount,
      status: data.status || 'FAILED',
    });
    console.log(`Transaction saved: ${transaction.id} [${data.status}]`);
  }
}
