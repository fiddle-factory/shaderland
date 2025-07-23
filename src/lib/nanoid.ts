import { customAlphabet } from "nanoid";

export function nanoid() {
  return customAlphabet(
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    15
  )();
}
