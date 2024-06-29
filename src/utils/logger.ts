import winston from 'winston';

export function setupLog(messagePrefix?: string) {
  const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({level, message, timestamp}) => {
        return `[${level.toUpperCase()}] [${timestamp}] ${messagePrefix ? `[${messagePrefix}]` : ''} ${message}`;
      })
    ),
    transports: [new winston.transports.Console()],
  });

  // Override the basic console methods
  console.error = (...args) => logger.error(args);
  console.warn = (...args) => logger.warn(args);
  console.info = (...args) => logger.info(args);
  console.log = (...args) => logger.info(args);
  console.debug = (...args) => logger.debug(args);
}
