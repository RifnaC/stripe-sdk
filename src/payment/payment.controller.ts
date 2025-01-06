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

    // create payment intent of the customer
    @Post('create-intent')
    async createPaymentIntent(@Body() body: { customerId: string, amount: number; currency: string }) {
        const { customerId, amount, currency } = body;
        return await this.paymentService.createPaymentIntent(customerId, amount, currency);
    }

    // retrieve payment intent details by payment intent id
    @Get('retrieve-intent/:id')
    async retrievePaymentIntent(@Param('id') id: string) {
        return await this.paymentService.retrievePaymentIntent(id);
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
