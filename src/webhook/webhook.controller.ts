import { Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { StripeService } from 'src/stripe/stripe.service';
import Stripe from 'stripe';

@Controller('webhook')
export class WebhookController {
    constructor(private readonly stripeService: StripeService) { }

    @Post()
    async handleWebhook(@Req() req: Request, @Headers('stripe-signature') signature: string) {
        const endpointSecret = 'your-webhook-signing-secret';

        let event: Stripe.Event;
        const stripe = this.stripeService.getStripeInstance();
        try {
            event = stripe.webhooks.constructEvent(
                req.body, // Raw body of the request
                signature,
                endpointSecret
            );
        } catch (err) {
            console.error(`⚠️  Webhook signature verification failed: ${err.message}`);
            throw new Error('Webhook verification failed');
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log(`PaymentIntent was successful!`, paymentIntent);
                break;

            case 'invoice.payment_succeeded':
                const invoice = event.data.object as Stripe.Invoice;
                console.log(`Invoice was paid!`, invoice);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return { received: true };

    }
}
