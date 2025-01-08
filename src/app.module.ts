import { Module } from '@nestjs/common';
import { StripeModule } from './stripe/stripe.module';
import { ConfigModule } from '@nestjs/config';

import { PaymentService } from './payment/payment.service';
import { WebhookController } from './webhook/webhook.controller';
import { PaymentController } from './payment/payment.controller';
@Module({
  imports: [StripeModule, ConfigModule.forRoot()],
  controllers: [PaymentController, WebhookController],
  providers: [PaymentService],
})
export class AppModule {}
