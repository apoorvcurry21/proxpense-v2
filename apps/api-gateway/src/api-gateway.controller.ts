import { Body, Controller, Get, Inject, Post, Param } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiGatewayService } from './api-gateway.service';

class TransferDto {
  senderId: string;
  receiverId: string;
  amount: number;
}

@Controller()
export class ApiGatewayController {
  constructor(
    private readonly apiGatewayService: ApiGatewayService,
    @Inject('KAFKA_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Get()
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  @Post('transfer')
  transfer(@Body() data: TransferDto) {
    this.client.emit('transfer_initiated', data);
    return { status: 'Pending', message: 'Transfer request received' };
  }

  @Post('wallets')
  async createWallet(@Body() data: any) {
    const response = await fetch(`${process.env.WALLET_SERVICE_URL}/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  @Get('wallets/:userId')
  async getWallet(@Param('userId') userId: string) {
    const response = await fetch(
      `${process.env.WALLET_SERVICE_URL}/wallets/${userId}`,
    );
    return response.json();
  }

  @Get('transactions/:userId')
  async getTransactions(@Param('userId') userId: string) {
    const response = await fetch(
      `${process.env.TRANSACTION_SERVICE_URL}/transactions/${userId}`,
    );
    return response.json();
  }
}
