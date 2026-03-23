import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PrismaModule } from './prisma.service';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'TRANSACTION_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9094'],
          },
        },
      },
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService],
})
export class AppModule {}
