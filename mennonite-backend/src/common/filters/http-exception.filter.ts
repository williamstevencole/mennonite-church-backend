import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import {
  genericMessageFor,
  isNestDefaultMessage,
} from '../messages/error-messages';

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(
        `[${request.method} ${request.url}] ${this.describe(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private resolve(exception: unknown): { status: number; message: string } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();
      const customMessage = this.extractCustomMessage(responseBody);

      if (customMessage && !isNestDefaultMessage(customMessage)) {
        return { status, message: customMessage };
      }
      return { status, message: genericMessageFor(status) };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const status = this.mapPrismaStatus(exception.code);
      return { status, message: genericMessageFor(status) };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: genericMessageFor(HttpStatus.BAD_REQUEST),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: genericMessageFor(HttpStatus.INTERNAL_SERVER_ERROR),
    };
  }

  private mapPrismaStatus(code: string): number {
    switch (code) {
      case 'P2002':
      case 'P2003':
      case 'P2014':
        return HttpStatus.CONFLICT;
      case 'P2025':
        return HttpStatus.NOT_FOUND;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }

  private extractCustomMessage(responseBody: unknown): string | null {
    if (typeof responseBody === 'string') return responseBody;
    if (responseBody && typeof responseBody === 'object') {
      const maybeMessage = (responseBody as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') return maybeMessage;
      if (Array.isArray(maybeMessage) && maybeMessage.length > 0) {
        return maybeMessage.join(', ');
      }
    }
    return null;
  }

  private describe(exception: unknown): string {
    if (exception instanceof Error)
      return `${exception.name}: ${exception.message}`;
    return String(exception);
  }
}
