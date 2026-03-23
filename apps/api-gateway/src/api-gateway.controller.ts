import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
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
}
