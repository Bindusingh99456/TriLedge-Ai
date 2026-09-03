/**
 * Idempotency Express Middleware for Financial Settlement Operations
 * Guarantees zero duplicate processing against network retries or client double-submits.
 */

import { Request, Response, NextFunction } from "express";

interface IdempotencyRecord {
  status: "IN_PROGRESS" | "COMPLETED";
  statusCode?: number;
  body?: any;
  createdAt: number;
  expiresAt: number;
}

// In-Memory Redis Fallback Cache Store with TTL eviction
const idempotencyStore = new Map<string, IdempotencyRecord>();

// Cleanup expired keys periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (now > record.expiresAt) {
      idempotencyStore.delete(key);
    }
  }
}, 30000);

export function idempotencyMiddleware(options: { required?: boolean; ttlSeconds?: number } = {}) {
  const isRequired = options.required ?? true;
  const ttlMs = (options.ttlSeconds ?? 120) * 1000;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Only apply to state-modifying HTTP methods (POST, PUT, PATCH, DELETE)
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      next();
      return;
    }

    const idempotencyKey = (req.headers["idempotency-key"] || req.headers["x-idempotency-key"]) as string | undefined;

    if (!idempotencyKey) {
      if (isRequired) {
        res.status(400).json({
          error: "Bad Request",
          message: "Idempotency-Key HTTP header is required for financial settlement operations."
        });
        return;
      }
      next();
      return;
    }

    const key = `triledger:idempotency:${idempotencyKey}`;
    const now = Date.now();
    const existing = idempotencyStore.get(key);

    if (existing && now <= existing.expiresAt) {
      if (existing.status === "IN_PROGRESS") {
        res.setHeader("X-Idempotency-Status", "IN_PROGRESS");
        res.status(409).json({
          error: "Conflict",
          message: `Settlement operation is currently in progress for Idempotency-Key: ${idempotencyKey}`,
          idempotencyKey
        });
        return;
      }

      if (existing.status === "COMPLETED") {
        res.setHeader("X-Idempotency-Status", "COMPLETED");
        res.setHeader("X-Cache-Lookup", "HIT (Idempotency)");
        res.status(existing.statusCode || 200).json(existing.body);
        return;
      }
    }

    // Set key as IN_PROGRESS (Atomic SET NX EX 120 equivalent)
    idempotencyStore.set(key, {
      status: "IN_PROGRESS",
      createdAt: now,
      expiresAt: now + ttlMs
    });

    res.setHeader("X-Idempotency-Key", idempotencyKey);
    res.setHeader("X-Idempotency-Status", "STORED");

    // Intercept res.json to capture response payload when handler completes
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      // Store result as COMPLETED
      idempotencyStore.set(key, {
        status: "COMPLETED",
        statusCode: res.statusCode,
        body,
        createdAt: now,
        expiresAt: Date.now() + ttlMs
      });
      return originalJson(body);
    };

    next();
  };
}

export function getIdempotencyStore() {
  return idempotencyStore;
}
