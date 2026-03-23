import { Controller, Get } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  getHello(): string {
    return this.transactionService.getHello();
  }

  @EventPattern('transfer_completed')
  async handleTransferCompleted(@Payload() data: any) {
    const transaction = await this.transactionService.createTransaction({
      senderId: data.senderId,
      receiverId: data.receiverId,
      amount: data.amount,
      status: 'completed',
    });
    console.log(`Transaction saved: ${transaction.id}`);
  }
}
