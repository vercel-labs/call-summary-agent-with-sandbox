/**
 * Simple structured logger for server-side console output.
 * Logs are visible in Vercel's dashboard and local terminal.
 *
 * For UI streaming, use workflow getWritable() in step functions.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const IS_DEV = process.env.NODE_ENV === 'development';
const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || (IS_DEV ? 'debug' : 'info');

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

class Logger {
  constructor(
    private context: string,
    private requestId?: string
  ) {}

  private formatMessage(level: LogLevel, message: string): string {
    const parts = [
      `[${level.toUpperCase()}]`,
      this.requestId ? `[${this.requestId}]` : null,
      `[${this.context}]`,
      message,
    ].filter(Boolean);

    return parts.join(' ');
  }

  debug(message: string, data?: unknown) {
    if (!shouldLog('debug')) return;
    console.log(this.formatMessage('debug', message), data ?? '');
  }

  info(message: string, data?: unknown) {
    if (!shouldLog('info')) return;
    console.log(this.formatMessage('info', message), data ?? '');
  }

  warn(message: string, data?: unknown) {
    if (!shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message), data ?? '');
  }

  error(message: string, error?: Error | unknown) {
    if (!shouldLog('error')) return;
    console.error(
      this.formatMessage('error', message),
      error instanceof Error ? error.message : error
    );
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
}

export function createLogger(context: string, requestId?: string): Logger {
  return new Logger(context, requestId);
}
