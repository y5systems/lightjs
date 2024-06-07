import {existsSync, readFileSync} from 'node:fs';

export function loadConfiguration(filePath: string): Record<string, unknown> | null {
  if (!existsSync(filePath)) {
    console.error(`Configuration file not found. File: ${filePath}`);
    return null;
  }

  try {
    console.log('Loading configuration file...');
    return JSON.parse(readFileSync(filePath).toString());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to parse config file. ${errorMessage}`);
    return null;
  }
}
