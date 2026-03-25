import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { WalletService } from './wallet.service';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('wallets')
  async createWallet(
    @Body() body: { userId: string; initialBalance: number },
  ): Promise<any> {
    return this.walletService.createWallet(body.userId, body.initialBalance);
  }

  @EventPattern('transfer_initiated')
  async handleTransfer(
    @Payload() data: { senderId: string; receiverId: string; amount: number },
  ): Promise<void> {
    return this.walletService.handleTransfer(data);
  }

  @Get('wallets/:userId')
  async getWallet(@Param('userId') userId: string) {
    const wallet = await this.walletService.getWallet(userId);
    if (!wallet) {
      throw new NotFoundException(`Wallet for user ${userId} not found`);
    }
    return wallet;
  }
}
