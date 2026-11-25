import { Request, Response, NextFunction } from 'express';
import zlib from 'node:zlib';

/**
 * High-performance, zero-dependency compression middleware using Node.js native zlib.
 * Reduces JSON and text response size by 70-85%, drastically decreasing network transfer
 * times and socket memory buffers on single-core / low-RAM backend hosting (<100MB RAM).
 */
export function nativeCompression(req: Request, res: Response, next: NextFunction) {
  const acceptEncoding = (req.headers['accept-encoding'] as string) || '';
  if (!acceptEncoding) return next();

  const originalSend = res.send.bind(res);

  res.send = (body: any): Response => {
    // Skip if already encoded or empty
    if (!body || res.getHeader('Content-Encoding')) {
      return originalSend(body);
    }

    let buffer: Buffer;
    let serializedBody: string | Buffer = body;

    if (typeof body === 'string') {
      buffer = Buffer.from(body, 'utf-8');
    } else if (Buffer.isBuffer(body)) {
      buffer = body;
    } else {
      serializedBody = JSON.stringify(body);
      buffer = Buffer.from(serializedBody, 'utf-8');
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    }

    // Skip compression for small payloads (< 512 bytes) where compression overhead outweighs benefits
    if (buffer.length < 512) {
      return originalSend(serializedBody);
    }

    if (/\bgzip\b/.test(acceptEncoding)) {
      zlib.gzip(buffer, { level: 6 }, (err, compressed) => {
        if (err) return originalSend(serializedBody);
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        res.removeHeader('Content-Length');
        originalSend(compressed);
      });
      return res;
    } else if (/\bdeflate\b/.test(acceptEncoding)) {
      zlib.deflate(buffer, { level: 6 }, (err, compressed) => {
        if (err) return originalSend(serializedBody);
        res.setHeader('Content-Encoding', 'deflate');
        res.setHeader('Vary', 'Accept-Encoding');
        res.removeHeader('Content-Length');
        originalSend(compressed);
      });
      return res;
    }

    return originalSend(serializedBody);
  };

  next();
}
