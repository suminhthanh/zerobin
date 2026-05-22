const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58encode(input: Uint8Array): string {
  if (input.length === 0) return "";

  const digits = [0];
  for (let i = 0; i < input.length; i++) {
    let carry = input[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let result = "";
  for (let i = 0; i < input.length && input[i] === 0; i++) {
    result += ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += ALPHABET[digits[i]];
  }
  return result;
}

export function base58decode(input: string): Uint8Array {
  if (input.length === 0) return new Uint8Array(0);

  const bytes = [0];
  for (let i = 0; i < input.length; i++) {
    const idx = ALPHABET.indexOf(input[i]);
    if (idx === -1) throw new Error(`Invalid base58 character: ${input[i]}`);
    let carry = idx;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  let numLeadingZeros = 0;
  for (let i = 0; i < input.length && input[i] === ALPHABET[0]; i++) {
    numLeadingZeros++;
  }

  const result = new Uint8Array(numLeadingZeros + bytes.length);
  for (let i = numLeadingZeros, j = bytes.length - 1; j >= 0; i++, j--) {
    result[i] = bytes[j];
  }
  return result;
}
