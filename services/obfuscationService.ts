
import { OBFUSCATION_CHARS } from '../constants';

const BASE = OBFUSCATION_CHARS.length;

export function encodeNumber(num: number): string {
  if (num === 0) {
    return OBFUSCATION_CHARS[0];
  }
  let result = '';
  let current = num;
  while (current > 0) {
    result = OBFUSCATION_CHARS[current % BASE] + result;
    current = Math.floor(current / BASE);
  }
  return result;
}

export function decodeString(str: string): number {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * BASE + OBFUSCATION_CHARS.indexOf(str[i]);
  }
  return result;
}
