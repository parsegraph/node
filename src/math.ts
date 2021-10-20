const getNumberPartsFArray = new Float64Array(1);
const getNumberPartsUArray = new Uint8Array(getNumberPartsFArray.buffer);
// http://stackoverflow.com/questions/9383593/extracting-the-exponent-and-mantissa-of-a-javascript-number

export interface NumberParts {
  sign: number;
  exponent: number;
  mantissa: number;
}

export function getNumberParts(x: number): NumberParts {
  const float = getNumberPartsFArray;
  const bytes = getNumberPartsUArray;
  float[0] = x;

  const sign = bytes[7] >> 7;
  const exponent = (((bytes[7] & 0x7f) << 4) | (bytes[6] >> 4)) - 0x3ff;
  bytes[7] = 0x3f;
  bytes[6] |= 0xf0;
  return {
    sign: sign,
    exponent: exponent,
    mantissa: float[0],
  };
}
