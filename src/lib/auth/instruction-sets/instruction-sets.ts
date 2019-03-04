/* istanbul ignore file */ // TODO: stabilize & test

import { binToHex, flattenBinArray } from '../../utils/utils';
import { BitcoinCashOpcodes } from './bitcoin-cash/bitcoin-cash';
import { BitcoinOpcodes } from './bitcoin/bitcoin';

export * from './bitcoin/bitcoin';
export * from './bitcoin-cash/bitcoin-cash';
export * from './common/common';

export interface AuthenticationInstructionPush<Opcodes = number> {
  /**
   * The data to be pushed to the stack.
   */
  readonly data: Uint8Array;
  /**
   * The opcode used to serialize this data.
   */
  readonly opcode: Opcodes;
}

export interface AuthenticationInstructionOperation<Opcodes = number> {
  /**
   * The opcode of this instruction's operation.
   */
  readonly opcode: Opcodes;
}

/**
 * A properly-formed instruction used by an `AuthenticationVirtualMachine`.
 */
export type AuthenticationInstruction<Opcodes = number> =
  | AuthenticationInstructionPush<Opcodes>
  | AuthenticationInstructionOperation<Opcodes>;

export type AuthenticationInstructions<
  Opcodes = number
  // tslint:disable-next-line:readonly-array
> = Array<AuthenticationInstruction<Opcodes>>;

export interface ParsedAuthenticationInstructionPushMalformedLength<
  Opcodes = number
> {
  /**
   * The expected number of length bytes (`length.length`) for this `PUSHDATA` operation.
   */
  readonly expectedLengthBytes: Bytes.Uint8 | Bytes.Uint16 | Bytes.Uint32;
  /**
   * The length `Uint8Array` provided. This instruction is malformed because the length of this `Uint8Array` is shorter than the `expectedLengthBytes`.
   */
  readonly length: Uint8Array;
  readonly malformed: true;
  readonly opcode: Opcodes;
}

export interface ParsedAuthenticationInstructionPushMalformedData<
  Opcodes = number
> {
  /**
   * The data `Uint8Array` provided. This instruction is malformed because the length of this `Uint8Array` is shorter than the `expectedDataBytes`.
   */
  readonly data: Uint8Array;
  /**
   * The expected number of data bytes (`data.length`) for this push operation.
   */
  readonly expectedDataBytes: number;
  readonly malformed: true;
  readonly opcode: Opcodes;
}

export type ParsedAuthenticationInstructionMalformed<Opcodes = number> =
  | ParsedAuthenticationInstructionPushMalformedLength<Opcodes>
  | ParsedAuthenticationInstructionPushMalformedData<Opcodes>;

/**
 * A potentially-malformed `AuthenticationInstruction`. If `malformed` is
 * `true`, this could be either
 * `ParsedAuthenticationInstructionPushMalformedLength` or
 * `ParsedAuthenticationInstructionPushMalformedData`
 *
 * If the final instruction is a push operation which requires more bytes than
 * are available in the remaining portion of a serialized script, that
 * instruction will have a `malformed` property with a value of `true`.
 * .
 */
export type ParsedAuthenticationInstruction<Opcodes = number> =
  | AuthenticationInstruction<Opcodes>
  | ParsedAuthenticationInstructionMalformed<Opcodes>;

/**
 * An array of authentication instructions which may end with a malformed
 * instruction.
 *
 * **Implementation note**: this type can be improved by only marking the final
 * element as potentially malformed. This is waiting on:
 * https://github.com/Microsoft/TypeScript/issues/1360
 *
 * The following type can be used when it doesn't produce the error,
 * `A rest element must be last in a tuple type. [1256]`:
 * ```ts
 * export type ParsedAuthenticationInstructions<Opcodes = number> = [
 *   ...AuthenticationInstruction<Opcodes>,
 *   ParsedAuthenticationInstruction<Opcodes>
 * ];
 * ```
 */
export type ParsedAuthenticationInstructions<Opcodes = number> =
  // tslint:disable-next-line:readonly-array
  Array<
    | AuthenticationInstruction<Opcodes>
    | ParsedAuthenticationInstruction<Opcodes>
  >;

export const authenticationInstructionIsMalformed = <Opcodes>(
  instruction: ParsedAuthenticationInstruction<Opcodes>
): instruction is ParsedAuthenticationInstructionMalformed<Opcodes> =>
  (instruction as ParsedAuthenticationInstructionMalformed<Opcodes>)
    .malformed === true;

export const authenticationInstructionsAreMalformed = <Opcodes>(
  instructions: ParsedAuthenticationInstructions<Opcodes>
  // tslint:disable-next-line:readonly-array
): instructions is Array<ParsedAuthenticationInstructionMalformed<Opcodes>> =>
  authenticationInstructionIsMalformed(instructions[instructions.length - 1]);

export const authenticationInstructionsAreNotMalformed = <Opcodes>(
  instructions: ParsedAuthenticationInstructions<Opcodes>
  // tslint:disable-next-line:readonly-array
): instructions is Array<AuthenticationInstruction<Opcodes>> =>
  !authenticationInstructionsAreMalformed(instructions);

const enum CommonPushOpcodes {
  OP_0 = 0x00,
  OP_PUSHDATA_1 = 0x4c,
  OP_PUSHDATA_2 = 0x4d,
  OP_PUSHDATA_4 = 0x4e
}

export enum Bytes {
  Uint8 = 1,
  Uint16 = 2,
  Uint32 = 4
}

/**
 * Note: this implementation assumes `script` is defined and long enough to read
 * the specified number of bytes. If necessary, validation should be done before
 * calling this method.
 *
 * @param script the Uint8Array from which to read
 * @param index the index from which to begin reading
 * @param length the number of bytes to read
 */
export const readLittleEndianNumber = (
  script: Uint8Array,
  index: number,
  length: Bytes
) => {
  const view = new DataView(script.buffer, index, length);
  const readAsLittleEndian = true;
  return length === Bytes.Uint8
    ? view.getUint8(0)
    : length === Bytes.Uint16
    ? view.getUint16(0, readAsLittleEndian)
    : view.getUint32(0, readAsLittleEndian);
};

/**
 * Note: this implementation assumes `script` is defined and long enough to
 * write the specified number of bytes. It also assumes the provided `number` is
 * representable in `length` bytes.
 *
 * If necessary, validation should be done before calling this method.
 *
 * @param script the Uint8Array to which the number should be written
 * @param index the index at which to begin reading
 * @param length the number of bytes to use
 * @param value the number to write at `script[index]`
 */
export const writeLittleEndianNumber = (
  script: Uint8Array,
  index: number,
  length: Bytes,
  value: number
) => {
  const view = new DataView(script.buffer, index, length);
  const writeAsLittleEndian = true;
  // tslint:disable-next-line:no-expression-statement
  length === Bytes.Uint8
    ? view.setUint8(0, value) // tslint:disable-line: no-void-expression
    : length === Bytes.Uint16
    ? view.setUint16(0, value, writeAsLittleEndian) // tslint:disable-line: no-void-expression
    : view.setUint32(0, value, writeAsLittleEndian); // tslint:disable-line: no-void-expression
  return script;
};

export const numberToLittleEndianBin = (value: number, length: Bytes) => {
  const array = new Uint8Array(length);
  return writeLittleEndianNumber(array, 0, length, value);
};

/**
 * Returns the number of bytes used to indicate the length of the push in this
 * operation.
 * @param opcode an opcode between 0x00 and 0x4e
 */
export const lengthBytesForPushOpcode = (opcode: number): number =>
  opcode < CommonPushOpcodes.OP_PUSHDATA_1
    ? 0
    : opcode === CommonPushOpcodes.OP_PUSHDATA_1
    ? Bytes.Uint8
    : opcode === CommonPushOpcodes.OP_PUSHDATA_2
    ? Bytes.Uint16
    : Bytes.Uint32;

/**
 * Parse one instruction from the provided script.
 *
 * Returns an object with an `instruction` referencing a
 * `ParsedAuthenticationInstruction`, and a `nextIndex` indicating the next
 * index from which to read. If the next index is greater than or equal to the
 * length of the script, the script has been fully parsed.
 *
 * The final `ParsedAuthenticationInstruction` from a serialized script may be
 * malformed if 1) the final operation is a push and 2) too few bytes remain for
 * the push operation to complete.
 *
 * @param script the script from which to read the next instruction
 * @param index the offset from which to begin reading
 */
// tslint:disable-next-line:cyclomatic-complexity
export const readAuthenticationInstruction = <Opcodes = number>(
  script: Uint8Array,
  index: number
): {
  readonly instruction: ParsedAuthenticationInstruction<Opcodes>;
  readonly nextIndex: number;
} => {
  const opcode = script[index];
  // tslint:disable-next-line:no-if-statement
  if (opcode > CommonPushOpcodes.OP_PUSHDATA_4) {
    return {
      instruction: {
        opcode: (opcode as unknown) as Opcodes
      },
      nextIndex: index + 1
    };
  }
  const lengthBytes = lengthBytesForPushOpcode(opcode);
  const pushBytes = lengthBytes === 0;
  // tslint:disable-next-line:no-if-statement
  if (!pushBytes && index + lengthBytes >= script.length) {
    const sliceStart = index + 1;
    const sliceEnd = sliceStart + lengthBytes;
    return {
      instruction: {
        expectedLengthBytes: lengthBytes,
        length: script.slice(sliceStart, sliceEnd),
        malformed: true,
        opcode: (opcode as unknown) as Opcodes
      },
      nextIndex: sliceEnd
    };
  }

  const dataBytes = pushBytes
    ? opcode
    : readLittleEndianNumber(script, index + 1, lengthBytes);
  const dataStart = index + 1 + lengthBytes;
  const dataEnd = dataStart + dataBytes;
  return {
    instruction: {
      data: script.slice(dataStart, dataEnd),
      ...(dataEnd > script.length
        ? {
            expectedDataBytes: dataEnd - dataStart,
            malformed: true
          }
        : undefined),
      opcode: (opcode as unknown) as Opcodes
    },
    nextIndex: dataEnd
  };
};

/**
 * Parse a serialized script into `ParsedAuthenticationInstructions`. The method
 * `authenticationInstructionsAreMalformed` can be used to check if these
 * instructions include a malformed instruction. If not, they are valid
 * `AuthenticationInstructions`.
 *
 * This implementation is common to most bitcoin forks, but the type parameter
 * can be used to strongly type the resulting instructions. For example:
 *
 * ```js
 *  const instructions = parseScript<BitcoinCashOpcodes>(script);
 * ```
 *
 * @param script the serialized script to parse
 */
export const parseScript = <Opcodes = number>(script: Uint8Array) => {
  // tslint:disable-next-line:readonly-array
  const instructions: ParsedAuthenticationInstructions<Opcodes> = [];
  // tslint:disable-next-line:no-let
  let i = 0;
  while (i < script.length) {
    const { instruction, nextIndex } = readAuthenticationInstruction<Opcodes>(
      script,
      i
    );
    // tslint:disable-next-line:no-expression-statement
    i = nextIndex;
    // tslint:disable-next-line:no-expression-statement
    instructions.push(instruction);
  }
  return instructions;
};

const isPush = <Opcodes>(
  instruction: AuthenticationInstruction<Opcodes>
): instruction is AuthenticationInstructionPush<Opcodes> =>
  // tslint:disable-next-line: strict-type-predicates
  (instruction as AuthenticationInstructionPush<Opcodes>).data !== undefined;

/**
 * OP_0 is the only single-word push. All other push instructions will
 * disassemble to multiple ASM words.
 */
const isMultiWordPush = (opcode: number) => opcode !== CommonPushOpcodes.OP_0;
const formatAsmPushHex = (data: Uint8Array) =>
  data.length > 0 ? `0x${binToHex(data)}` : '';
const formatMissingBytesAsm = (missing: number) =>
  `[missing ${missing} byte${missing === 1 ? '' : 's'}]`;
const hasMalformedLength = <Opcodes>(
  instruction: ParsedAuthenticationInstructionMalformed<Opcodes>
): instruction is ParsedAuthenticationInstructionPushMalformedLength<Opcodes> =>
  // tslint:disable-next-line: strict-type-predicates
  (instruction as ParsedAuthenticationInstructionPushMalformedLength<Opcodes>)
    .length !== undefined;
const isPushData = (pushOpcode: number) =>
  lengthBytesForPushOpcode(pushOpcode) > 0;

export const disassembleParsedAuthenticationInstructionMalformed = <
  Opcodes = number
>(
  opcodes: { readonly [opcode: number]: string },
  instruction: ParsedAuthenticationInstructionMalformed<Opcodes>
): string =>
  `${opcodes[(instruction.opcode as unknown) as number]} ${
    hasMalformedLength(instruction)
      ? `${formatAsmPushHex(instruction.length)}${formatMissingBytesAsm(
          instruction.expectedLengthBytes - instruction.length.length
        )}`
      : `${
          isPushData((instruction.opcode as unknown) as number)
            ? `${instruction.expectedDataBytes} `
            : ''
        }${formatAsmPushHex(instruction.data)}${formatMissingBytesAsm(
          instruction.expectedDataBytes - instruction.data.length
        )}`
  }`;

export const disassembleAuthenticationInstruction = <Opcodes = number>(
  opcodes: { readonly [opcode: number]: string },
  instruction: AuthenticationInstruction<Opcodes>
): string =>
  `${opcodes[(instruction.opcode as unknown) as number]}${
    isPush(instruction) &&
    isMultiWordPush((instruction.opcode as unknown) as number)
      ? ` ${
          isPushData((instruction.opcode as unknown) as number)
            ? `${instruction.data.length} `
            : ''
        }${formatAsmPushHex(instruction.data)}`
      : ''
  }`;

export const disassembleParsedAuthenticationInstruction = <Opcodes = number>(
  opcodes: { readonly [opcode: number]: string },
  instruction: ParsedAuthenticationInstruction<Opcodes>
): string =>
  authenticationInstructionIsMalformed(instruction)
    ? disassembleParsedAuthenticationInstructionMalformed<Opcodes>(
        opcodes,
        instruction
      )
    : disassembleAuthenticationInstruction<Opcodes>(opcodes, instruction);

/**
 * Disassemble an array of `ParsedAuthenticationInstructions` (including
 * potentially malformed instructions) into its ASM representation.
 *
 * @param script the array of instructions to disassemble
 */
export const disassembleParsedAuthenticationInstructions = <Opcodes = number>(
  opcodes: { readonly [opcode: number]: string },
  instructions: ReadonlyArray<ParsedAuthenticationInstruction<Opcodes>>
): string =>
  instructions
    .map(instruction =>
      disassembleParsedAuthenticationInstruction<Opcodes>(opcodes, instruction)
    )
    .join(' ');

/**
 * Disassemble a serialized script into a lossless ASM representation.
 *
 * TODO: a similar method which re-formats ASM strings, converting HexLiterals to Script Numbers or UTF8Literals.
 *
 * @param opcodes the set to use when determining the name of opcodes, e.g. `BitcoinCashOpcodes`
 * @param script the serialized script to disassemble
 */
export const disassembleScript = <Opcode = number>(
  opcodes: { readonly [opcode: number]: string },
  script: Uint8Array
) =>
  disassembleParsedAuthenticationInstructions(
    opcodes,
    parseScript<Opcode>(script)
  );

/**
 * Disassemble a serialized BCH script into its ASM representation.
 * @param script the serialized script to disassemble
 */
export const disassembleScriptBCH = (script: Uint8Array) =>
  disassembleParsedAuthenticationInstructions(
    BitcoinCashOpcodes,
    parseScript<BitcoinCashOpcodes>(script)
  );

/**
 * Disassemble a serialized BTC script into its ASM representation.
 * @param script the serialized script to disassemble
 */
export const disassembleScriptBTC = (script: Uint8Array) =>
  disassembleParsedAuthenticationInstructions(
    BitcoinOpcodes,
    parseScript<BitcoinOpcodes>(script)
  );

const getLengthBytes = <Opcodes>(
  instruction: AuthenticationInstructionPush<Opcodes>
) =>
  numberToLittleEndianBin(
    instruction.data.length,
    lengthBytesForPushOpcode((instruction.opcode as unknown) as number)
  );

export const serializeAuthenticationInstruction = <Opcodes = number>(
  instruction: AuthenticationInstruction<Opcodes>
) =>
  Uint8Array.from([
    (instruction.opcode as unknown) as number,
    ...(isPush(instruction)
      ? [
          ...(isPushData((instruction.opcode as unknown) as number)
            ? getLengthBytes(instruction)
            : []),
          ...instruction.data
        ]
      : [])
  ]);

export const serializeParsedAuthenticationInstructionMalformed = <
  Opcodes = number
>(
  instruction: ParsedAuthenticationInstructionMalformed<Opcodes>
) =>
  Uint8Array.from([
    (instruction.opcode as unknown) as number,
    ...(hasMalformedLength(instruction)
      ? instruction.length
      : isPushData((instruction.opcode as unknown) as number)
      ? numberToLittleEndianBin(
          instruction.expectedDataBytes,
          lengthBytesForPushOpcode((instruction.opcode as unknown) as number)
        )
      : []),
    ...(!hasMalformedLength(instruction) ? instruction.data : [])
  ]);

export const serializeParsedAuthenticationInstruction = <Opcodes = number>(
  instruction: ParsedAuthenticationInstruction<Opcodes>
): Uint8Array =>
  authenticationInstructionIsMalformed(instruction)
    ? serializeParsedAuthenticationInstructionMalformed(instruction)
    : serializeAuthenticationInstruction(instruction);

export const serializeAuthenticationInstructions = <Opcodes = number>(
  instructions: ReadonlyArray<AuthenticationInstruction<Opcodes>>
) => flattenBinArray(instructions.map(serializeAuthenticationInstruction));

export const serializeParsedAuthenticationInstructions = <Opcodes = number>(
  instructions: ReadonlyArray<ParsedAuthenticationInstruction<Opcodes>>
) =>
  flattenBinArray(instructions.map(serializeParsedAuthenticationInstruction));
