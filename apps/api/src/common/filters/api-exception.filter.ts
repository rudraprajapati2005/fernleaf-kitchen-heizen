import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  error: {
    code: string;
    message: string | string[];
    details?: unknown;
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? exceptionResponse.message
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';
    const code =
      statusCode === HttpStatus.FORBIDDEN
        ? 'FORBIDDEN'
        : statusCode === HttpStatus.UNAUTHORIZED
          ? 'UNAUTHORIZED'
          : statusCode === HttpStatus.SERVICE_UNAVAILABLE
            ? 'SERVICE_UNAVAILABLE'
            : statusCode >= 500
              ? 'INTERNAL_SERVER_ERROR'
              : 'REQUEST_ERROR';

    const body: ApiErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      error: {
        code,
        message: Array.isArray(message) || typeof message === 'string' ? message : 'Request failed',
        ...(typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'error' in exceptionResponse
          ? { details: exceptionResponse.error }
          : {}),
      },
    };

    response.status(statusCode).json(body);
  }
}
