export interface LogContext {
  traceId?: string;
  service?: string;
  action?: string;
  durationMs?: number;
  [key: string]: any;
}

export function logStructured(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context: LogContext = {}
) {
  const logPayload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: context.service || 'ledgersync-reconciliation-engine',
    traceId: context.traceId || `trace-${Math.random().toString(36).substring(2, 9)}`,
    ...context
  };

  if (level === 'error') {
    console.error(JSON.stringify(logPayload));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logPayload));
  } else {
    console.log(JSON.stringify(logPayload));
  }
}
