import * as Crypto from 'expo-crypto';

import { getSetting, setSetting } from '../db/db';

const HASH_KEY = 'pin_hash';
const SALT_KEY = 'pin_salt';
const FAILS_KEY = 'pin_fails';
const LOCKED_UNTIL_KEY = 'pin_locked_until';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

function randomSalt() {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hash(pin, salt) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function hasPin() {
  const v = await getSetting(HASH_KEY, '');
  return !!v;
}

export async function setPin(pin) {
  const salt = randomSalt();
  const h = await hash(pin, salt);
  await setSetting(HASH_KEY, h);
  await setSetting(SALT_KEY, salt);
  await setSetting(FAILS_KEY, '0');
  await setSetting(LOCKED_UNTIL_KEY, '0');
}

export async function verifyPin(pin) {
  const stored = await getSetting(HASH_KEY, '');
  const salt = await getSetting(SALT_KEY, '');
  if (!stored || !salt) return { ok: true, locked: false };

  const lockedUntil = parseInt(await getSetting(LOCKED_UNTIL_KEY, '0'), 10);
  if (lockedUntil > Date.now()) {
    return { ok: false, locked: true, remainingMs: lockedUntil - Date.now() };
  }

  const h = await hash(pin, salt);
  if (h === stored) {
    await setSetting(FAILS_KEY, '0');
    await setSetting(LOCKED_UNTIL_KEY, '0');
    return { ok: true, locked: false };
  }

  const fails = parseInt(await getSetting(FAILS_KEY, '0'), 10) + 1;
  await setSetting(FAILS_KEY, String(fails));
  if (fails >= MAX_ATTEMPTS) {
    await setSetting(LOCKED_UNTIL_KEY, String(Date.now() + LOCKOUT_MS));
    await setSetting(FAILS_KEY, '0');
    return { ok: false, locked: true, remainingMs: LOCKOUT_MS };
  }
  return { ok: false, locked: false, attemptsLeft: MAX_ATTEMPTS - fails };
}

export async function clearPin() {
  await setSetting(HASH_KEY, '');
  await setSetting(SALT_KEY, '');
  await setSetting(FAILS_KEY, '0');
  await setSetting(LOCKED_UNTIL_KEY, '0');
}

export const PIN_LENGTH = 6;
