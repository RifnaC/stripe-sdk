import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { StripeService } from 'src/stripe/stripe.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
    constructor(private readonly stripeService: StripeService) { }

     // Create a customer
    async createCustomer(email: string, name?: string, paymentMethod?: string) {
        const stripe = this.stripeService.getStripeInstance();

        return stripe.customers.create({
            email,
            name,
            payment_method: paymentMethod || "pm_card_visa",
            invoice_settings: {
                default_payment_method: "pm_card_visa"
            },
            preferred_locales: [
                "en"
            ]
        });
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
    async createPaymentIntent(customerId:string, amount: number, currency: string) {
        try {
            const stripe = this.stripeService.getStripeInstance();
            return stripe.paymentIntents.create({
                amount,
                currency,
                customer: customerId,
                payment_method_types: ['card'],
                payment_method: "pm_card_visa",
                automatic_payment_methods: {
                    enabled: true, // Automatically manage payment methods
                    allow_redirects: 'never', // Disallow redirect-based payment methods
                },
            });
        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw error;
        }
    }

    // retrieve payment intent by payment intent id
   async retrievePaymentIntent(paymentIntentId: string){
    const stripe = this.stripeService.getStripeInstance();
    return stripe.paymentIntents.retrieve(paymentIntentId)
   }

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


}
