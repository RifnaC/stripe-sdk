import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}

import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { CreatePaymentIntentDto } from './dtos/create-payment-Intent.dto';
import { ConfirmPaymentIntentDto } from './dtos/confirm-payment-intent.dto';
import { StripeCustomer } from './schemas/stripe.schema';
import { paymentIntent } from './schemas/payment-intent.schema';
import { Payment, PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    @InjectModel('StripeCustomer')
    private readonly stripeModel: Model<StripeCustomer>,
    @InjectModel('paymentIntent')
    private readonly paymentIntentModel: Model<paymentIntent>,
    @InjectModel('Payment') private readonly PaymentModel: Model<Payment>,
  ) {
    const secretKey = process.env.STRIPE_API_KEY;
    const apiVersion = process.env.API_VERSION;

    if (!secretKey || !apiVersion) {
      throw new Error('Missing Stripe configuration');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: apiVersion as Stripe.LatestApiVersion,
    });
  }

  async getBasePlan() {
    try {
      const prices = await this.stripe.prices.list({
        lookup_keys: ['base_plan'],
        expand: ['data.product'],
      });

      if (!prices.data.length) {
        throw new Error('Base plan not found');
      }

      return prices;
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Failed to fetch base plan');
    }
  }

  async createCustomer(customer: CreateCustomerDto) {
    const { metadata } = customer;
    const { company_name, company } = metadata;

    try {
      // Check MongoDB first for existing customer (more efficient)
      const existingCustomer = await this.stripeModel
        .findOne({
          company: company,
        })
        .exec();

      if (existingCustomer) {
        return {
          message: 'Customer already exists',
          customer: existingCustomer,
        };
      }

      const stripeCustomer = await this.stripe.customers.create({
        metadata: { company_name, company },
        preferred_locales: ['en'],
      });

      const savedCustomer = await this.stripeModel.create({
        company_name: metadata.company_name,
        company: metadata.company,
        stripeCustomerId: stripeCustomer.id,
      });

      return {
        message: 'Customer created successfully',
        customer: savedCustomer,
      };
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Failed to create customer');
    }
  }

  async createPaymentIntent(paymentIntentDto: CreatePaymentIntentDto) {
    const { customerId, amount, idempotencyKey } = paymentIntentDto;

    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount,
          currency: 'usd',
          customer: customerId,
          payment_method_types: ['card'],
          payment_method: 'pm_card_visa',
        },
        { idempotencyKey },
      );

      const savedPaymentIntent = await this.paymentIntentModel.create({
        stripePaymentIntentId: paymentIntent.id,
        customerId: paymentIntent.customer,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });

      return {
        message: 'Payment intent created successfully',
        paymentIntent: savedPaymentIntent,
      };
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Failed to create payment intent');
    }
  }

  async confirmPaymentIntent(confirmPaymentIntentDto: ConfirmPaymentIntentDto) {
    const session = await this.PaymentModel.startSession();
    session.startTransaction();

    try {
      const { paymentIntentId, paymentMethodId } = confirmPaymentIntentDto;
      const confirmedPayment = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        },
      );

      await this.PaymentModel.create(
        [
          {
            customerId: confirmedPayment.customer,
            paymentIntentId: confirmedPayment.id,
            paymentMethodId,
            amount: confirmedPayment.amount,
            status: confirmedPayment.status,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return confirmedPayment;
    } catch (error) {
      await session.abortTransaction();
      throw error instanceof Error
        ? error
        : new Error('Failed to confirm payment intent');
    } finally {
      session.endSession();
    }
  }

  async createSubscription(createSubscription: ConfirmPaymentIntentDto) {
    const { customerId, priceId } = createSubscription;
    const session = await this.PaymentModel.startSession();
    session.startTransaction();

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent'],
      });

      await this.PaymentModel.create(
        [
          {
            customerId,
            subscriptionId: subscription.id,
            priceId,
            status: subscription.status,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return subscription;
    } catch (error) {
      await session.abortTransaction();
      throw error instanceof Error
        ? error
        : new Error('Failed to create subscription');
    } finally {
      session.endSession();
    }
  }

  async processPaymentAndCreateSubscription(
    confirmPaymentIntentDto: ConfirmPaymentIntentDto,
  ) {
    const session = await this.PaymentModel.startSession();
    session.startTransaction();

    try {
      const confirmedPaymentIntent = await this.confirmPaymentIntent(
        confirmPaymentIntentDto,
      );

      if (confirmedPaymentIntent.status !== 'succeeded') {
        throw new Error('Payment confirmation failed');
      }

      const subscription = await this.createSubscription(
        confirmPaymentIntentDto,
      );

      await this.PaymentModel.findOneAndUpdate(
        { paymentIntentId: confirmPaymentIntentDto.paymentIntentId },
        { subscriptionId: subscription.id, status: subscription.status },
        { session },
      );

      await session.commitTransaction();
      return subscription;
    } catch (error) {
      await session.abortTransaction();
      throw error instanceof Error
        ? error
        : new Error('Failed to process payment and create subscription');
    } finally {
      session.endSession();
    }
  }

  async getPaymentByIntentId(
    paymentIntentId: string,
  ): Promise<PaymentDocument> {
    return this.PaymentModel.findOne({ paymentIntentId }).exec();
  }

  async getCustomerPayments(customerId: string): Promise<PaymentDocument[]> {
    return this.PaymentModel.find({ customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getCustomerSubscriptions(
    customerId: string,
  ): Promise<PaymentDocument[]> {
    return this.PaymentModel.find({
      customerId,
      subscriptionId: { $exists: true },
    }).exec();
  }
}

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    @InjectModel('StripeCustomer')
    private readonly stripeModel: Model<StripeCustomer>,
    @InjectModel('paymentIntent')
    private readonly paymentIntentModel: Model<paymentIntent>,
    @InjectModel('Payment') private readonly PaymentModel: Model<Payment>,
  ) {
    const secretKey = process.env.STRIPE_API_KEY;
    const apiVersion = process.env.API_VERSION;

    if (!secretKey || !apiVersion) {
      throw new Error('Missing Stripe configuration');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: apiVersion as Stripe.LatestApiVersion,
    });
  }

  async getBasePlan() {
    try {
      const prices = await this.stripe.prices.list({
        lookup_keys: ['base_plan'],
        expand: ['data.product'],
      });

      if (!prices.data.length) {
        throw new Error('Base plan not found');
      }

      return prices;
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Failed to fetch base plan');
    }
  }

  async createCustomer(customer: CreateCustomerDto) {
    const { metadata } = customer;
    const { company_name, company } = metadata;

    try {
      // Check MongoDB first for existing customer (more efficient)
      const existingCustomer = await this.stripeModel
        .findOne({
          company: company,
        })
        .exec();

      if (existingCustomer) {
        return {
          message: 'Customer already exists',
          customer: existingCustomer,
        };
      }

      const stripeCustomer = await this.stripe.customers.create({
        metadata: { company_name, company },
        preferred_locales: ['en'],
      });

      const savedCustomer = await this.stripeModel.create({
        company_name: metadata.company_name,
        company: metadata.company,
        stripeCustomerId: stripeCustomer.id,
      });

      return {
        message: 'Customer created successfully',
        customer: savedCustomer,
      };
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Failed to create customer');
    }
  }

  async createPaymentIntent(paymentIntentDto: CreatePaymentIntentDto) {
    const { customerId, amount, idempotencyKey } = paymentIntentDto;

    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount,
          currency: 'usd',
          customer: customerId,
          payment_method_types: ['card'],
          payment_method: 'pm_card_visa',
        },
        { idempotencyKey },
      );

      const savedPaymentIntent = await this.paymentIntentModel.create({
        stripePaymentIntentId: paymentIntent.id,
        customerId: paymentIntent.customer,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });

      return {
        message: 'Payment intent created successfully',
        paymentIntent: savedPaymentIntent,
      };
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Failed to create payment intent');
    }
  }

  async confirmPaymentIntent(confirmPaymentIntentDto: ConfirmPaymentIntentDto) {
    const session = await this.PaymentModel.startSession();
    session.startTransaction();

    try {
      const { paymentIntentId, paymentMethodId } = confirmPaymentIntentDto;
      const confirmedPayment = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        },
      );

      await this.PaymentModel.create(
        [
          {
            customerId: confirmedPayment.customer,
            paymentIntentId: confirmedPayment.id,
            paymentMethodId,
            amount: confirmedPayment.amount,
            status: confirmedPayment.status,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return confirmedPayment;
    } catch (error) {
      await session.abortTransaction();
      throw error instanceof Error
        ? error
        : new Error('Failed to confirm payment intent');
    } finally {
      session.endSession();
    }
  }

  async createSubscription(createSubscription: ConfirmPaymentIntentDto) {
    const { customerId, priceId } = createSubscription;
    const session = await this.PaymentModel.startSession();
    session.startTransaction();

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent'],
      });

      await this.PaymentModel.create(
        [
          {
            customerId,
            subscriptionId: subscription.id,
            priceId,
            status: subscription.status,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return subscription;
    } catch (error) {
      await session.abortTransaction();
      throw error instanceof Error
        ? error
        : new Error('Failed to create subscription');
    } finally {
      session.endSession();
    }
  }

  async processPaymentAndCreateSubscription(
    confirmPaymentIntentDto: ConfirmPaymentIntentDto,
  ) {
    const session = await this.PaymentModel.startSession();
    session.startTransaction();

    try {
      const confirmedPaymentIntent = await this.confirmPaymentIntent(
        confirmPaymentIntentDto,
      );

      if (confirmedPaymentIntent.status !== 'succeeded') {
        throw new Error('Payment confirmation failed');
      }

      const subscription = await this.createSubscription(
        confirmPaymentIntentDto,
      );

      await this.PaymentModel.findOneAndUpdate(
        { paymentIntentId: confirmPaymentIntentDto.paymentIntentId },
        { subscriptionId: subscription.id, status: subscription.status },
        { session },
      );

      await session.commitTransaction();
      return subscription;
    } catch (error) {
      await session.abortTransaction();
      throw error instanceof Error
        ? error
        : new Error('Failed to process payment and create subscription');
    } finally {
      session.endSession();
    }
  }

  async getPaymentByIntentId(
    paymentIntentId: string,
  ): Promise<PaymentDocument> {
    return this.PaymentModel.findOne({ paymentIntentId }).exec();
  }

  async getCustomerPayments(customerId: string): Promise<PaymentDocument[]> {
    return this.PaymentModel.find({ customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getCustomerSubscriptions(
    customerId: string,
  ): Promise<PaymentDocument[]> {
    return this.PaymentModel.find({
      customerId,
      subscriptionId: { $exists: true },
    }).exec();
  }
}
