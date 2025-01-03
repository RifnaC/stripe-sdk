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
});
