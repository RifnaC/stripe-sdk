import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentService: PaymentService) { }


    @Post('create-customer')
    async createCustomer(@Body('email') email: string, @Body('name') name: string, @Body('paymentMethod') paymentMethod: string) {
        return this.paymentService.createCustomer(email, name, paymentMethod);
    }

    @Get('customers')
    async getCustomerList() {
        return this.paymentService.getCustomerList();
    }

    @Get('/:id')
    async getCustomerById(@Param('id') customerId: string) {
        return this.paymentService.getCustomerById(customerId);
    }

    @Put('/:id')
    async editCustomer(@Param('id') customerId: string, @Body('name') name?: string, @Body('email') email?: string) {
        return this.paymentService.editCustomer(customerId, name, email);
    }

    @Delete('/:id')
    async deleteCustomer(@Param('id') customerId: string) {
        return this.paymentService.deleteCustomer(customerId);
    }

    @Post('create-intent')
    async createPaymentIntent(@Body('amount') amount: number, @Body('currency') currency: string) {
        return this.paymentService.createPaymentIntent(amount, currency);
    }

    @Post('confirm-intent')
    async confirmPaymentIntent(
        @Body('paymentIntentId') paymentIntentId: string,
        @Body('paymentMethodId') paymentMethodId: string,
    ) {
        return this.paymentService.confirmPaymentIntent(paymentIntentId, paymentMethodId);
    }

    @Post('create-invoice')
    async createInvoice(@Body('customer') customer: string) {
        return this.paymentService.createInvoice(customer);
    }
    @Get('invoice/:invoiceId')
    async getInvoice(@Param('invoiceId') invoiceId: string) {
        return this.paymentService.invoicePaymentIntent(invoiceId);
    }



}
