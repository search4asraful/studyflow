import { describe, it, expect, vi } from 'vitest';
import { nativeCompression } from '../middleware/compression';
import zlib from 'node:zlib';

describe('nativeCompression Middleware', () => {
  it('should skip compression if accept-encoding is missing', () => {
    const req: any = { headers: {} };
    const res: any = {
      send: vi.fn(),
      getHeader: vi.fn(),
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const next = vi.fn();

    nativeCompression(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should skip compression for small payloads (< 512 bytes)', () => {
    const req: any = { headers: { 'accept-encoding': 'gzip, deflate' } };
    let capturedSend: any;
    const res: any = {
      send: vi.fn().mockImplementation((body) => {
        capturedSend = body;
      }),
      getHeader: vi.fn().mockReturnValue(null),
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const next = vi.fn();

    nativeCompression(req, res, next);
    expect(next).toHaveBeenCalled();

    const smallText = 'Hello World';
    res.send(smallText);

    expect(capturedSend).toBe(smallText);
    expect(res.setHeader).not.toHaveBeenCalledWith('Content-Encoding', 'gzip');
  });

  it('should compress large payloads with gzip when client supports gzip', async () => {
    const req: any = { headers: { 'accept-encoding': 'gzip, deflate' } };
    let capturedBuffer: Buffer | null = null;
    const res: any = {
      send: vi.fn().mockImplementation((body) => {
        capturedBuffer = body;
      }),
      getHeader: vi.fn().mockReturnValue(null),
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const next = vi.fn();

    nativeCompression(req, res, next);

    // Payload larger than 512 bytes
    const largePayload = JSON.stringify({
      data: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` })),
    });

    await new Promise<void>((resolve) => {
      res.send = (body: any) => {
        capturedBuffer = body;
        resolve();
      };
      // Trigger the wrapped send
      nativeCompression(req, res, () => {
        res.send(largePayload);
      });
    });

    expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
    expect(capturedBuffer).toBeDefined();

    // Verify decompression matches original payload
    const unzipped = zlib.gunzipSync(capturedBuffer!).toString('utf-8');
    expect(JSON.parse(unzipped)).toEqual(JSON.parse(largePayload));
  });
});
