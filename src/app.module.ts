import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StripeModule } from './stripe/stripe.module';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';
import { WebhookController } from './webhook/webhook.controller';

@Module({
  imports: [StripeModule, ConfigModule.forRoot()],
  controllers: [PaymentsController, WebhookController],
  providers: [PaymentService],
})
export class AppModule {}
