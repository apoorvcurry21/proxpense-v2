import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(
    @Inject('TRANSACTION_SERVICE') private readonly client: ClientProxy,
  ) {}

  @EventPattern('transfer_initiated')
  handleTransfer(@Payload() data: any) {
    console.log('Received transfer_initiated event:', data);
    this.client.emit('transfer_completed', { ...data, status: 'SUCCESS' });
  }
}
