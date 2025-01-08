import { Controller, Post, Get, Param, Body, Query, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    // 1. Get Price List: Retrieve product pricing from Stripe
    @Get('prices')
    @HttpCode(HttpStatus.OK)
    async getPriceList() {
        try {
            const prices = await this.paymentService.getPriceList();
            return { prices };
        } catch (error) {
            console.error('Error fetching price list:', error);
            throw error;
        }
    }

    // 2. Create Customer: Create a new customer with their payment method
    @Post('customer')
    @HttpCode(HttpStatus.CREATED)
    async createCustomer(@Body() customerData: {
        email: string;
        name: string;
        address: { line1: string, line2?: string, city?: string, state?: string, postal_code?: string, country?: string };
        phone: string;
        paymentMethod: string;
    }) {
        try {
            const customer = await this.paymentService.createCustomer(
                customerData.email,
                customerData.name,
                customerData.address,
                customerData.phone,
                customerData.paymentMethod,
            );
            return { customer };
        } catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        }
    }

    // 3. Create Payment Intent: Handle payments by creating a payment intent for a customer
    @Post('payment-intent')
    @HttpCode(HttpStatus.CREATED)
    async createPaymentIntent(@Body() paymentIntentData: {
        customerId: string;
        amount: number;
        currency: string;
        idempotencyKey: string;
    }) {
        try {
            const paymentIntent = await this.paymentService.createPaymentIntent(
                paymentIntentData.customerId,
                paymentIntentData.amount,
                paymentIntentData.currency,
                paymentIntentData.idempotencyKey,
            );
            return { paymentIntent };
        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw error;
        }
    }

    // 4. Retrieve Payment Intent: Retrieve payment intent details by ID
    @Get('payment-intent/:paymentIntentId')
    @HttpCode(HttpStatus.OK)
    async retrievePaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
        try {
            const paymentIntent = await this.paymentService.retrievePaymentIntent(paymentIntentId);
            return { paymentIntent };
        } catch (error) {
            console.error('Error retrieving payment intent:', error);
            throw error;
        }
    }

    // 5. Confirm Payment Intent: Confirm the payment intent when the payment method is provided
    @Post('payment-intent/confirm')
    @HttpCode(HttpStatus.OK)
    async confirmPaymentIntent(@Body() confirmData: {
        paymentIntentId: string;
        paymentMethodId: string;
    }) {
        try {
            const confirmation = await this.paymentService.confirmPaymentIntent(
                confirmData.paymentIntentId,
                confirmData.paymentMethodId,
            );
            return { confirmation };
        } catch (error) {
            console.error('Error confirming payment intent:', error);
            throw error;
        }
    }

    // 6. Create Invoice: Create and manage invoices for customers
    @Post('invoice')
    @HttpCode(HttpStatus.CREATED)
    async createInvoice(@Body('customer') customerId: string) {
        try {
            const invoice = await this.paymentService.createInvoice(customerId);
            return { invoice };
        } catch (error) {
            console.error('Error creating invoice:', error);
            throw error;
        }
    }

    // 7. Get Invoice Details: Get invoice details by invoice ID
    @Get('invoice/:invoiceId')
    @HttpCode(HttpStatus.OK)
    async getInvoiceDetails(@Param('invoiceId') invoiceId: string) {
        try {
            const invoiceDetails = await this.paymentService.invoicePaymentIntent(invoiceId);
            return { invoiceDetails };
        } catch (error) {
            console.error('Error retrieving invoice details:', error);
            throw error;
        }
    }

    // 8. Create Subscription: Manage product subscriptions, including trial and price plans
    @Post('subscription')
    @HttpCode(HttpStatus.CREATED)
    async createSubscription(@Body() subscriptionData: {
        customerId: string;
        priceId: string;
    }) {
        try {
            const subscription = await this.paymentService.createSubscription(
                subscriptionData.customerId,
                subscriptionData.priceId,
            );
            return { subscription };
        } catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
        }
    }

    // 9. Preview Invoices: Preview upcoming invoices based on customer and subscription ID
    @Get('subscription/:subscriptionId/preview')
    @HttpCode(HttpStatus.OK)
    async previewInvoices(
        @Param('subscriptionId') subscriptionId: string,
        @Query('customerId') customerId: string,
        @Query('priceId') priceId: string
    ) {
        try {
            const invoicePreview = await this.paymentService.previewInvoices(
                customerId,
                priceId,
                subscriptionId,
            );
            return { invoicePreview };
        } catch (error) {
            console.error('Error previewing invoice:', error);
            throw error;
        }
    }

    // 10. Update Subscription: Update subscriptions (e.g., change plans or quantities)
    @Post('subscription/:subscriptionId/update')
    @HttpCode(HttpStatus.OK)
    async updateSubscription(
        @Param('subscriptionId') subscriptionId: string,
        @Body() updateData: { priceId: string; quantity?: number }
    ) {
        try {
            const updatedSubscription = await this.paymentService.updateSubscription(
                subscriptionId,
                updateData.priceId,
                updateData.quantity,
            );
            return { updatedSubscription };
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }
    }

    // 11. Cancel Subscription: Cancel subscriptions
    @Post('subscription/:subscriptionId/cancel')
    @HttpCode(HttpStatus.OK)
    async cancelSubscription(@Param('subscriptionId') subscriptionId: string) {
        try {
            const canceledSubscription = await this.paymentService.cancelSubscription(subscriptionId);
            return { canceledSubscription };
        } catch (error) {
            console.error('Error canceling subscription:', error);
            throw error;
        }
    }

    // 12. Get Subscription: Retrieve a subscription by its ID
    @Get('subscription/:subscriptionId')
    @HttpCode(HttpStatus.OK)
    async getSubscription(@Param('subscriptionId') subscriptionId: string) {
        try {
            const subscription = await this.paymentService.getSubscription(subscriptionId);
            return { subscription };
        } catch (error) {
            console.error('Error retrieving subscription:', error);
            throw error;
        }
    }

    @Post('top-up')
    @HttpCode(HttpStatus.OK)
    async topUp(@Body('amount') amount: number) {
        try {
            return await this.paymentService.topUp(amount);
             ;
        } catch (error:any) {
            console.error('Error top-up:', error.message);
            
        }
    }
}
