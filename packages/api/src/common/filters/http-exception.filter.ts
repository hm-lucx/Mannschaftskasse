import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = (request as any).correlationId || uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = exceptionResponse.message || message;
        if (Array.isArray(exceptionResponse.message)) {
          details = exceptionResponse.message.map((m: string) => ({ message: m }));
          message = 'Validation failed';
        }
      }

      switch (status) {
        case 400: code = 'VALIDATION_ERROR'; break;
        case 401: code = 'UNAUTHENTICATED'; break;
        case 403: code = 'FORBIDDEN'; break;
        case 404: code = 'NOT_FOUND'; break;
        case 409: code = 'CONFLICT'; break;
        case 429: code = 'RATE_LIMITED'; break;
        default: code = 'HTTP_ERROR';
      }
    } else if (exception instanceof Error) {
      console.error(`[${correlationId}] Unhandled error:`, exception);
    }

    response.status(status).json({
      code,
      message,
      details: details.length > 0 ? details : undefined,
      correlationId,
    });
  }
}
