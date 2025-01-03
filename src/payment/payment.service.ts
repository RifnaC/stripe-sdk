import { Injectable } from '@nestjs/common';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class PaymentService {
    constructor(private readonly stripeService: StripeService) { }

    async createPaymentIntent(amount: number, currency: string, metadata?: Record<string, string>) {
        const stripe = this.stripeService.getStripeInstance();

        return stripe.paymentIntents.create({
            amount,
            currency,
            metadata,
            automatic_payment_methods: {
                enabled: true, // Automatically manage payment methods
            },
        });
    }

    async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string, returnUrl?: string) {
        const stripe = this.stripeService.getStripeInstance();
    
        return stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId, // Attach the payment method
            ...(returnUrl && { return_url: returnUrl }), // Include return_url if provided
        });
    }
    


    async createCustomer(email: string, name?: string) {
        const stripe = this.stripeService.getStripeInstance();

        return stripe.customers.create({
            email,
            name,
        });
    }
// All customers list
    async getCustomerList()  {
        return await this.stripeService.getStripeInstance().customers.list();
    }

    // customers list with customerid

    async getCustomerById(customerId: string)  {
        return await this.stripeService.getStripeInstance().customers.retrieve(customerId);
    }
}
