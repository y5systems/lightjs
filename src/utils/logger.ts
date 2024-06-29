import winston from 'winston';

const RegexPatterns = {
  bigInt: /^0x([0-9A-F]+)n$/,
  isoDate: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
} as const;

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

export function replacer(_key: string, value: any) {
  if (typeof value === 'bigint') {
    return '0x' + value.toString(16).toUpperCase() + 'n';
  }

  return value;
}

export function reviver(_key: string, value: any) {
  if (typeof value === 'string' && RegexPatterns.bigInt.test(value)) {
    return BigInt(value.slice(0, -1));
  }

  if (typeof value === 'string' && RegexPatterns.isoDate.test(value)) {
    return new Date(value);
  }

  return value;
}
