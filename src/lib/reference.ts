import { customAlphabet } from "nanoid";

// Unambiguous uppercase alphabet (no 0/O, 1/I/L) for human-friendly booking references.
const referenceAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const generateReferenceCode = customAlphabet(referenceAlphabet, 7);

/** Short, human-friendly booking reference, e.g. "BB-7K2P9QX". */
export function generateBookingReference(): string {
  return `BB-${generateReferenceCode()}`;
}

const generateTokenPart = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  48
);

/** Long, unguessable token used in "manage your booking" links. */
export function generateManageToken(): string {
  return generateTokenPart();
}
