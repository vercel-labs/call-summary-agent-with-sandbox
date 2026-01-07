type LogEntry = {
  time: string;
  context: string;
  level: string;
  message: string;
  data?: Record<string, unknown>;
};

type Subscriber = (log: LogEntry) => void;

class LogStream {
  private subscribers = new Set<Subscriber>();
  private buffer: LogEntry[] = [];
  private maxBuffer = 100;

  emit(log: LogEntry) {
    this.buffer.push(log);
    if (this.buffer.length > this.maxBuffer) {
      this.buffer.shift();
    }
    this.subscribers.forEach((fn) => fn(log));
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
  }
}

export const logStream = new LogStream();
export type { LogEntry };
