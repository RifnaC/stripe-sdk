import { Injectable } from '@nestjs/common';
import { StripeService } from 'src/stripe/stripe.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
    constructor(private readonly stripeService: StripeService) { }

    // 1. Get prices of the product
    async getPriceList() {
        const stripe = this.stripeService.getStripeInstance();
        const prices = await stripe.prices.list({
            lookup_keys: ['base_plan'], // Change as per your pricing strategy
            expand: ['data.product']
        });
        return prices;
    }

    // 2. Create a customer
    async createCustomer(email: string, name: string, address: { line1: string, line2?: string, city?: string, state?: string, postal_code?: string, country?: string }, phone: string, paymentMethod: string) {
        const stripe = this.stripeService.getStripeInstance();
        return stripe.customers.create({
            email,
            name,
            address,
            phone,
            payment_method: paymentMethod || "pm_card_visa", // Default if no method provided
            invoice_settings: {
                default_payment_method: "pm_card_visa" // You can customize this based on the payment method
            },
            preferred_locales: ["en"]
        });
    }

    // 3. Create payment intent
    async createPaymentIntent(customerId: string, amount: number, currency: string, idempotencyKey: string) {
        const stripe = this.stripeService.getStripeInstance();
        return stripe.paymentIntents.create({
            amount,
            currency,
            customer: customerId,
            payment_method_types: ['card'],
            payment_method: "pm_card_visa", // Default payment method
        }, {
            idempotencyKey // Ensures this operation is unique and idempotent
        });
    }

    // 4. Retrieve payment intent by ID
    async retrievePaymentIntent(paymentIntentId: string) {
        const stripe = this.stripeService.getStripeInstance();
        return stripe.paymentIntents.retrieve(paymentIntentId);
    }

    // 5. Confirm payment intent
    async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
        const stripe = this.stripeService.getStripeInstance();
        return stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId,
        });
    }

    // 6. Create invoice
    async createInvoice(customer: string) {
        const stripe = this.stripeService.getStripeInstance();
        return stripe.invoices.create({
            customer,
        });
    }

    // 7. Get invoice details by invoice ID
    async invoicePaymentIntent(invoiceId: string) {
        const stripe = this.stripeService.getStripeInstance();
        return stripe.invoices.retrieve(invoiceId);
    }

    // 8. Create subscription with dynamic price ID and optional trial
    async createSubscription(customerId: string, priceId: string) {
        const stripe = this.stripeService.getStripeInstance();
        try {
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{
                    price: priceId,
                }],
                expand: ['latest_invoice.payment_intent'],
            });
            return subscription;
        } catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
        }
    }

    // 9. Preview invoices for upcoming subscription
    async previewInvoices(customerId: string, priceId: string, subscriptionId: string) {
        const stripe = this.stripeService.getStripeInstance();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const invoice = await stripe.invoices.retrieveUpcoming({
            customer: customerId,
            subscription: subscriptionId,
            subscription_items: [{
                id: subscription.items.data[0].id,
                price: priceId,
            }],
        });
        return invoice;
    }

    // 10. Update subscription (e.g., change plan or quantity)
    async updateSubscription(subscriptionId: string, priceId: string, quantity: number = 1) {
        const stripe = this.stripeService.getStripeInstance();
        try {
            return await stripe.subscriptions.update(subscriptionId, {
                items: [{
                    id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
                    price: priceId,
                    quantity,
                }],
            });
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }
    }

    // 11. Cancel subscription
    async cancelSubscription(subscriptionId: string) {
        const stripe = this.stripeService.getStripeInstance();
        try {
            return await stripe.subscriptions.cancel(subscriptionId);
        } catch (error) {
            console.error('Error canceling subscription:', error);
            throw error;
        }
    }

    // 12. Retrieve a subscription by subscription ID
    async getSubscription(subscriptionId: string) {
        const stripe = this.stripeService.getStripeInstance();
        return await stripe.subscriptions.retrieve(subscriptionId);
    }

    async topUp(
        customerId: string,
        amount: number,
    ): Promise<Stripe.InvoiceItem> {
        const stripe = this.stripeService.getStripeInstance();
        return stripe.invoiceItems.create({
            customer: customerId,
            amount: amount * 100,
            currency: 'usd', // Adjust to your currency
            description: 'Subscription Top-Up',
        });
    }

}
