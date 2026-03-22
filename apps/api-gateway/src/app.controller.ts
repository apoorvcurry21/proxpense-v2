import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppService } from './app.service';

class TransferDto {
  senderId: string;
  receiverId: string;
  amount: number;
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('KAFKA_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('transfer')
  transfer(@Body() data: TransferDto) {
    this.client.emit('transfer_initiated', data);
    return { status: 'Pending', message: 'Transfer request received' };
  }
}
