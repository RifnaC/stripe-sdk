import { Injectable } from '@nestjs/common';
import { StripeService } from 'src/stripe/stripe.service';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import {
  ConfirmPaymentIntentDto,
  CreatePaymentIntentDto,
} from './dtos/payment-intent.dto';
import { UpdateSubscriptionDto } from './dtos/subscription.dto';
import { TopUpDto } from './dtos/top-up.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly stripeService: StripeService) {}

  // 1. Get prices of the product
  async getPriceList() {
    try {
      const stripe = this.stripeService.getStripeInstance();
      return await stripe.prices.list({
        lookup_keys: ['base_plan'], // Change as per your pricing strategy
        expand: ['data.product'],
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching price list:', error.message);
      } else {
        console.error('An unknown error occurred:', error);
      }
      throw error;
    }
  }

  // 2. Create a customer
  async createCustomer(customer: CreateCustomerDto) {
    const { metadata } = customer;
    const stripe = this.stripeService.getStripeInstance();

    // Check if a customer with matching metadata exists
    const existingCustomer = await stripe.customers.list();
    const foundCustomer = existingCustomer.data.find((c) => {
      return Object.entries(metadata).every(
        ([key, value]) => c.metadata?.[key] === value,
      );
    });

    if (foundCustomer) {
      return { message: 'Customer with matching metadata already exists' };
    }

    try {
      return stripe.customers.create({
        metadata,
        preferred_locales: ['en'],
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error creating customer:', error.message);
      } else {
        console.error('An unknown error occurred:', error);
      }

      throw error;
    }
  }

  // 3. Create payment intent
  async createPaymentIntent(PaymentIntent: CreatePaymentIntentDto) {
    const stripe = this.stripeService.getStripeInstance();
    const { customerId, amount, currency, idempotencyKey } = PaymentIntent;
    try {
      return stripe.paymentIntents.create(
        {
          amount,
          currency,
          customer: customerId,
          payment_method_types: ['card'],
          payment_method: 'pm_card_visa', // Default payment method
        },
        {
          idempotencyKey, // Ensures this operation is unique and idempotent
        },
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error creating payment intent:', error.message);
      } else {
        console.error('An unknown error occurred:', error);
      }
      throw error;
    }
  }

  // 4. Retrieve payment intent by ID
  async retrievePaymentIntent(paymentIntentId: string) {
    const stripe = this.stripeService.getStripeInstance();
    try {
      return stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error retrieving payment intent:', error);
      } else {
        console.error('An unknown error occurred:', error);
      }
      throw error;
    }
  }

  // 5. Confirm payment intent
  async confirmPaymentIntent(confirmPaymentIntent: ConfirmPaymentIntentDto) {
    const stripe = this.stripeService.getStripeInstance();
    try {
      const { paymentIntentId, paymentMethodId } = confirmPaymentIntent;
      return stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error retrieving payment intent:', error.message);
      } else {
        console.error('An unknown error occurred:', error);
      }
      throw error;
    }
  }

  // 6. Create subscription with dynamic price ID and optional trial
  async createSubscription(createSubscription: ConfirmPaymentIntentDto) {
    const stripe = this.stripeService.getStripeInstance();
    const { customerId, priceId } = createSubscription;

    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: priceId,
          },
        ],
        expand: ['latest_invoice.payment_intent'],
      });
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // 7. Update subscription with dynamic price ID and optional quantity
  async processPaymentAndCreateSubscription(
    confirmPaymentIntentDto: ConfirmPaymentIntentDto,
  ) {
    try {
      const confirmedPaymentIntent = await this.confirmPaymentIntent(
        confirmPaymentIntentDto,
      );

      if (confirmedPaymentIntent.status !== 'succeeded') {
        throw new Error('Payment confirmation failed.');
      }

      const subscription = await this.createSubscription(
        confirmPaymentIntentDto,
      );
      return subscription;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          'Error processing payment and creating subscription:',
          error.message,
        );
      } else {
        console.error('An unknown error occurred:', error);
      }
      throw error;
    }
  }

  // 8. Create invoice
  async createInvoice(customer: string) {
    const stripe = this.stripeService.getStripeInstance();
    try {
      return stripe.invoices.create({
        customer,
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // 9. Get invoice details by invoice ID
  async invoicePaymentIntent(invoiceId: string) {
    const stripe = this.stripeService.getStripeInstance();
    try {
      return stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      console.error('Error retrieving invoice details:', error);
      throw error;
    }
  }

  // 10. Preview invoices for upcoming subscription
  async previewInvoices(
    customerId: string,
    priceId: string,
    subscriptionId: string,
  ) {
    const stripe = this.stripeService.getStripeInstance();
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return await stripe.invoices.retrieveUpcoming({
        customer: customerId,
        subscription: subscriptionId,
        subscription_items: [
          {
            id: subscription.items.data[0].id,
            price: priceId,
          },
        ],
      });
    } catch (error) {
      console.error('Error previewing invoice:', error);
      throw error;
    }
  }

  // 11. Update subscription (e.g., change plan or quantity)
  async updateSubscription(
    subscriptionId: string,
    updateSubscription: UpdateSubscriptionDto,
  ) {
    const stripe = this.stripeService.getStripeInstance();
    const { priceId, quantity } = updateSubscription;
    try {
      return await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: (await stripe.subscriptions.retrieve(subscriptionId)).items
              .data[0].id,
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

  // 12. Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    const stripe = this.stripeService.getStripeInstance();
    try {
      return await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // 13. Retrieve a subscription by subscription ID
  async getSubscription(subscriptionId: string) {
    const stripe = this.stripeService.getStripeInstance();
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  // 14. Top-up a customer's credit card balance
  async topUp(topUp: TopUpDto) {
    const stripe = this.stripeService.getStripeInstance();
    const { customer, amount } = topUp;
    try {
      return stripe.invoiceItems.create({
        customer: customer,
        amount: amount * 100,
        currency: 'usd', // Adjust to your currency
        description: 'Subscription Top-Up',
      });
    } catch (error) {
      console.error('Error top-up:', error);
      throw error;
    }
  }
}
