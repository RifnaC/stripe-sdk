import { Injectable } from '@nestjs/common';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class PaymentService {
    constructor(private readonly stripeService: StripeService) { }

    // Create a customer
    async createCustomer(email: string,
        name: string,
        address: { line1: string, line2?: string, city?: string, state?: string, postal_code?: string, country?: string },
        phone: string,
        idempotencyKey: string,
        paymentMethod: string,
    ) {
        const stripe = this.stripeService.getStripeInstance();

        return stripe.customers.create({
            email,
            name,
            address,
            phone,
            payment_method: paymentMethod || "pm_card_visa",
            invoice_settings: {
                default_payment_method: "pm_card_visa"
            },
            preferred_locales: [
                "en"
            ]
        },
            {
                idempotencyKey
            }
        );
    }

    // All customers list
    async getCustomerList() {
        return await this.stripeService.getStripeInstance().customers.list();
    }

    // customers list with customerid
    async getCustomerById(customerId: string) {
        return await this.stripeService.getStripeInstance().customers.retrieve(customerId);
    }

    // edit customer intent
    async editCustomer(customerId: string, name?: string, email?: string,) {
        return this.stripeService.getStripeInstance().customers.update(customerId,
            {
                name,
                email
            }
        );
    }

    // delete customer intent
    async deleteCustomer(customerId: string) {
        return await this.stripeService.getStripeInstance().customers.del(customerId);
    }

    // create payment intent
    async createPaymentIntent(customerId: string, amount: number, currency: string, idempotencyKey: string) {
        try {
            const stripe = this.stripeService.getStripeInstance();
            return stripe.paymentIntents.create({
                amount,
                currency,
                customer: customerId,
                payment_method_types: ['card'],
                payment_method: "pm_card_visa",
            },
                {
                    idempotencyKey
                });
        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw error;
        }
    }

    // retrieve payment intent by payment intent id
    async retrievePaymentIntent(paymentIntentId: string) {
        const stripe = this.stripeService.getStripeInstance();
        return stripe.paymentIntents.retrieve(paymentIntentId)
    }

    //confirm payment intent
    async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string,) {
        const stripe = this.stripeService.getStripeInstance();
        return stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId,
        });
    }

    // async create invoice
    async createInvoice(customer: string) {
        return this.stripeService.getStripeInstance().invoices.create({
            customer,
        })
    }

    // Get invoice details by invoice id
    async invoicePaymentIntent(invoiceId) {
        return this.stripeService.getStripeInstance().invoices.retrieve(
            invoiceId
        );
    }

    async createPrice() {
        const stripe = this.stripeService.getStripeInstance();
        await stripe.prices.create({
            currency: 'usd',
            unit_amount: 1000,
            recurring: {
                interval: 'month',
            },
            product_data: {
                name: 'Gold Plan',
            },
        });
    }

    // Create a subscription with dynamic price ID and optional trial
    async createSubscription(customerId: string, priceId: string,) {
        const stripe = this.stripeService.getStripeInstance();
        try {
            const subscription=  await stripe.subscriptions.create({
                customer: customerId,
                items: [
                    {
                        price: priceId, // Allow dynamic price plan
                    },
                ],
                payment_behavior: 'default_incomplete',
                collection_method: 'charge_automatically',
            });
            return subscription;
        } catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
        }
    }

    // Update subscription (e.g., change plan or quantity)
    async updateSubscription(subscriptionId: string, priceId: string, quantity: number = 1) {
        const stripe = this.stripeService.getStripeInstance();

        try {
            return await stripe.subscriptions.update(subscriptionId, {
                items: [
                    {
                        id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
                        price: priceId,
                        quantity,
                    },
                ],
            });
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }
    }

    // Cancel subscription
    async cancelSubscription(subscriptionId: string) {
        const stripe = this.stripeService.getStripeInstance();

        try {
            return await stripe.subscriptions.cancel(subscriptionId);
        } catch (error) {
            console.error('Error canceling subscription:', error);
            throw error;
        }
    }

    // Retrieve a subscription by subscription ID
    async getSubscription(subscriptionId: string) {
        const stripe = this.stripeService.getStripeInstance();
        return await stripe.subscriptions.retrieve(subscriptionId);
    }

    async getPriceList() {
        const stripe = this.stripeService.getStripeInstance();
        const price = await stripe.prices.list();
        return price;
    }
}
