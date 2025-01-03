import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    const message = exception instanceof HttpException ? exception.getResponse() : exception.message;

    this.logger.error(`Error: ${JSON.stringify(message)}`, exception.stack);

    response.status(status).json({
      statusCode: status,
      message: message,
    });
  }
}
