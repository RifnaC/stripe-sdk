// import { Body, Controller, Get, Param, Post } from '@nestjs/common';
// import { StripeService } from './stripe.service';

// @Controller('stripe')
// export class StripeController {
//     constructor(private readonly stripeService: StripeService) { }

//     @Post('payment-intent')
//     async createPaymentIntent(@Body() body: { amount: number; currency: string }) {
//         const { amount, currency } = body;
//         return await this.stripeService.createPaymentIntent(amount, currency);
//     }

//     @Get('payment-intent/:id')
//     async retrievePaymentIntent(@Param('id') id: string) {
//         console.log('Retrieve Payment Intent called with ID:', id);
//         return this.stripeService.retrievePaymentIntent(id);
        
//     }

//     // @Post('payment-intent/:id/confirm')
//     // async confirmPaymentIntent(@Param('id') id: string) {
//     //     return await this.stripeService.confirmPaymentIntent(id);
//     // }

    
// }
