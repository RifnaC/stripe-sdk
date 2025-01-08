import { Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeService } from 'src/stripe/stripe.service';
import Stripe from 'stripe';

@Controller('webhook')
export class WebhookController {
    constructor(private readonly stripeService: StripeService,
        private readonly configService: ConfigService) { }

    @Post()
    async handleWebhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
        const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_KEY');
        let event: Stripe.Event;
        const stripe = this.stripeService.getStripeInstance();
        const payload = req.body;
        try {
            event = stripe.webhooks.constructEvent(
                payload,
                signature,
                endpointSecret
            );
        } catch (err: any) {
            console.error(`⚠️  Webhook signature verification failed: ${err?.message}`);
            throw new Error('Webhook verification failed');
        }
        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log(`PaymentIntent was successful!`, paymentIntent);
                break;
            case 'payment_intent.payment_failed':
                console.log('Payment failed:', event.data.object);
                break;
            case 'customer.created':
                const customer = event.data.object as Stripe.Customer;
                console.log('Customer created:', customer.id);
    
                break;

            case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                console.log('Payment successful for session:', session.id);
                break;
                
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        return { received: true };
    }
}

