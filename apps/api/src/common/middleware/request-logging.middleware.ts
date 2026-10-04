import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    response.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const entry = {
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      };

      if (process.env.NODE_ENV === 'production') {
        process.stdout.write(`${JSON.stringify(entry)}\n`);
      } else {
        this.logger.log(`${entry.method} ${entry.path} ${entry.statusCode} ${entry.durationMs}ms`);
      }
    });
    next();
  }
}
