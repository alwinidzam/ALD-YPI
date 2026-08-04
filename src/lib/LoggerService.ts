export class LoggerService {
  static error(message: string, error?: any, context?: any) {
    console.error(`[ERROR] ${message}`, error, context);
    // Future: send to Sentry, Crashlytics, or remote logging API
  }
  static warn(message: string, context?: any) {
    console.warn(`[WARN] ${message}`, context);
  }
  static info(message: string, context?: any) {
    console.info(`[INFO] ${message}`, context);
  }
}
