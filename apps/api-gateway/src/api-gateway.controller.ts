import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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
  async createWallet(
    @Body() data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const serviceUrl = process.env.WALLET_SERVICE_URL;
    if (!serviceUrl) {
      throw new HttpException(
        'Wallet Service URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    try {
      const response = await fetch(`${serviceUrl}/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        throw new HttpException(
          (result.message as string) || 'Failed to create wallet',
          response.status,
        );
      }
      return result;
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('wallets/:userId')
  async getWallet(@Param('userId') userId: string): Promise<unknown> {
    const serviceUrl = process.env.WALLET_SERVICE_URL;
    if (!serviceUrl) {
      throw new HttpException(
        'Wallet Service URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    try {
      const response = await fetch(`${serviceUrl}/wallets/${userId}`);
      if (response.status === 404) return null;

      const text = await response.text();
      let result: unknown = null;
      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        throw new HttpException(
          'Invalid response from Wallet Service',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!response.ok) {
        let message = 'Failed to fetch wallet';
        if (result && typeof result === 'object' && 'message' in result) {
          const resObj = result as Record<string, unknown>;
          if (typeof resObj.message === 'string') {
            message = resObj.message;
          }
        }
        throw new HttpException(message, response.status);
      }
      return result;
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transactions/:userId')
  async getTransactions(@Param('userId') userId: string): Promise<unknown> {
    const serviceUrl = process.env.TRANSACTION_SERVICE_URL;
    if (!serviceUrl) {
      throw new HttpException(
        'Transaction Service URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    try {
      const response = await fetch(`${serviceUrl}/transactions/${userId}`);
      if (response.status === 404) return [];

      const text = await response.text();
      let result: unknown = null;
      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        throw new HttpException(
          'Invalid response from Transaction Service',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!response.ok) {
        let message = 'Failed to fetch transactions';
        if (result && typeof result === 'object' && 'message' in result) {
          const resObj = result as Record<string, unknown>;
          if (typeof resObj.message === 'string') {
            message = resObj.message;
          }
        }
        throw new HttpException(message, response.status);
      }
      return result;
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
