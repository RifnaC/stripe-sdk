import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('create-intent')
    async createPaymentIntent(@Body('amount') amount: number, @Body('currency') currency: string) {
        return this.paymentService.createPaymentIntent(amount, currency);
    }

    @Post('confirm-intent')
    async confirmPaymentIntent(
        @Body('paymentIntentId') paymentIntentId: string,
        @Body('paymentMethodId') paymentMethodId: string,
        @Body('returnUrl') returnUrl?: string,
    ) {
        return this.paymentService.confirmPaymentIntent(paymentIntentId, paymentMethodId, returnUrl);
    }



    @Post('create-customer')
    async createCustomer(@Body('email') email: string, @Body('name') name: string) {
        return this.paymentService.createCustomer(email, name);
    }

    @Get('customers')
    async getCustomerList() {
        return this.paymentService.getCustomerList();
    }

    @Get('/:id')
    async getCustomerById(@Param('id') customerId: string) {
        return this.paymentService.getCustomerById(customerId);
    }
}
