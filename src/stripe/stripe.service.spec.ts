import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';// import the mock


describe('StripeService', () => {
  let stripeService: StripeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
      ],
    }).compile();

    stripeService = module.get<StripeService>(StripeService);
  });

  it('should be defined', () => {
    expect(stripeService).toBeDefined();
  });

  // describe('createCustomer', () => {
  //   it('should create a customer', async () => {
  //     const customer = await stripeService.createCustomer('test@test.com', 'Test User');
  //     expect(customer).toHaveProperty('id', 'cus_test');
  //     expect(customer).toHaveProperty('email', 'test@test.com');
  //     expect(customer).toHaveProperty('name', 'Test User');
  //     expect(mockStripe.customers.create).toHaveBeenCalledWith({ email: 'test@test.com', name: 'Test User' });
  //   });
  // });

  // describe('createPaymentIntent', () => {
  //   it('should create a payment intent', async () => {
  //     const paymentIntent = await stripeService.createPaymentIntent(1000, 'usd');
  //     expect(paymentIntent).toHaveProperty('id', 'pi_test');
  //     expect(paymentIntent).toHaveProperty('amount', 1000);
  //     expect(paymentIntent).toHaveProperty('currency', 'usd');
  //     expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({ amount: 1000, currency: 'usd' });
  //   });
  // });

  // describe('retrieveCustomer', () => {
  //   it('should retrieve a customer', async () => {
  //     const customer = await stripeService.retrieveCustomer('cus_test');
  //     expect(customer).toHaveProperty('id', 'cus_test');
  //     expect(customer).toHaveProperty('email', 'test@test.com');
  //     expect(customer).toHaveProperty('name', 'Test User');
  //     expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_test');
  //   });
  // });
});
