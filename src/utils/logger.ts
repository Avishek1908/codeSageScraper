export class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = this.getTimestamp();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('INFO', message, ...args));
  }

  success(message: string, ...args: any[]): void {
    console.log('\x1b[32m%s\x1b[0m', this.formatMessage('SUCCESS', message, ...args));
  }

  warn(message: string, ...args: any[]): void {
    console.warn('\x1b[33m%s\x1b[0m', this.formatMessage('WARN', message, ...args));
  }

  error(message: string, ...args: any[]): void {
    console.error('\x1b[31m%s\x1b[0m', this.formatMessage('ERROR', message, ...args));
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.DEBUG === 'true') {
      console.log('\x1b[36m%s\x1b[0m', this.formatMessage('DEBUG', message, ...args));
    }
  }
}
