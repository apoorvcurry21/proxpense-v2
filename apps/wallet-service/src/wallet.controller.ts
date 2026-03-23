import { Controller, Post, Body } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { WalletService } from './wallet.service';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('wallets')
  async createWallet(@Body() body: { userId: string; initialBalance: number }) {
    return this.walletService.createWallet(body.userId, body.initialBalance);
  }

  @EventPattern('transfer_initiated')
  async handleTransfer(
    @Payload() data: { senderId: string; receiverId: string; amount: number },
  ) {
    return this.walletService.handleTransfer(data);
  }
}
