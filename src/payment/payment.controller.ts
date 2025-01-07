import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentService: PaymentService) { }

    @Get('list')
    async getPriceList() {
        return this.paymentService.getPriceList();
    }
    @Post('create-customer')
    async createCustomer(@Body() body: {
        email: string,
        name: string,
        address: {
            line1: string,
            line2?: string,
            city: string,
            state: string,
            postal_code: string,
            country: string,
        },
        phone: string,
        idempotencyKey: string,
        paymentMethod?: string,
    }) {
        const { email, name, address, phone, idempotencyKey, paymentMethod } = body;
        return this.paymentService.createCustomer(
            email,
            name,
            address,
            phone,
            idempotencyKey,
            paymentMethod
        );
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
    async editCustomer(@Param('id') customerId: string, @Body() body: { email?: string, name?: string, }) {
        const { name, email } = body;
        return this.paymentService.editCustomer(customerId, name, email);
    }

    @Delete('/:id')
    async deleteCustomer(@Param('id') customerId: string) {
        return this.paymentService.deleteCustomer(customerId);
    }

    // create payment intent of the customer
    @Post('create-intent')
    async createPaymentIntent(@Body() body: { customerId: string, amount: number; currency: string, idempotencyKey: string }) {
        const { customerId, amount, currency, idempotencyKey } = body;
        return await this.paymentService.createPaymentIntent(customerId, amount, currency, idempotencyKey);
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

    @Post("create-price")
    async createPrice() {
        return this.paymentService.createPrice();
    }
    @Post('subscription')
    async createSubscription(@Body() body: { customerId: string, priceId: string }) {
        const { customerId, priceId } = body;
        return this.paymentService.createSubscription(customerId, priceId);
    }

    @Get('subscription/:subscriptionId')
    async getSubscription(@Param('subscriptionId') subscriptionId: string) {
        return this.paymentService.getSubscription(subscriptionId);
    }
    @Put('subscription/:subscriptionId')
    async updateSubscription(@Param('subscriptionId') subscriptionId: string, @Body('priceId') priceId: string) {
        return this.paymentService.updateSubscription(subscriptionId, priceId);
    }

    @Delete("subscription/:subscriptionId")
    async cancelSubscription(@Param('subscriptionId') subscriptionId: string) {
        return this.paymentService.cancelSubscription(subscriptionId);
    }


}
