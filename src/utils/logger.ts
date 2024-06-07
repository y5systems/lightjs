import consoleStamp from 'console-stamp';

export function setupLog(prefixConfig?: {name: string}) {
  // @ts-ignore
  consoleStamp(console, {
    format: ':label(7) :date(yyyy-mm-dd HH:MM:ss.l) :prefix()',
    tokens: {
      prefix: () => {
        return !prefixConfig ? '[main]' : `[${prefixConfig.name}]`;
      }
    }
  });
}

export function replacer(_key: string, value: any) {
  if (typeof value === 'bigint') {
    return '0x' + value.toString(16) + 'n';
  }

  return value;
}

export function reviver(_key: string, value: any) {
  const bigIntRegex = /^0x([0-9a-f]+)n$/;
  if (typeof value === 'string' && bigIntRegex.test(value)) {
    return BigInt(value.slice(0, -1));
  }

  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (typeof value === 'string' && isoDateRegex.test(value)) {
    return new Date(value);
  }

  return value;
}

