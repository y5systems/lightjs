import {readFileSync} from 'node:fs';

export function loadConfiguration(filePath: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(filePath, {encoding: 'utf-8'}));
  } catch (error) {
    let errorMessage = 'Unknown error';

    if (error instanceof SyntaxError) {
      errorMessage = `Json Parsing Error. ${error.message}`;
    } else if (error instanceof Error) {
      if ('code' in error) {
        errorMessage = `File System Error. ${(error as NodeJS.ErrnoException).code} - ${error.message}`;
      } else {
        errorMessage = `Unknown error. ${error.message}`;
      }
    }

    throw new Error(`Failed to load configuration from ${filePath}. ${errorMessage}`);
  }
}
