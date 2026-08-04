/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * WIB (Asia/Jakarta, UTC+7) date/time helpers used by the attendance system.
 * NOTE: the day-boundary math here intentionally mirrors the existing
 * `getTodayDateString()` defined locally inside App.tsx (used for the daily
 * upload-quota reset), so "today" means the same instant everywhere in the
 * app. If that formula ever changes, update it here too.
 */

const SHORT_DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function toWIB(date: Date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 7); // UTC+7
}

export function getWIBDateString(date: Date = new Date()): string {
  const wib = toWIB(date);
  const yyyy = wib.getFullYear();
  const mm = String(wib.getMonth() + 1).padStart(2, '0');
  const dd = String(wib.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getWIBDayName(date: Date = new Date()): string {
  return SHORT_DAYS_ID[toWIB(date).getDay()];
}

export function getWIBTimeString(date: Date = new Date()): string {
  const wib = toWIB(date);
  const hh = String(wib.getHours()).padStart(2, '0');
  const mi = String(wib.getMinutes()).padStart(2, '0');
  const ss = String(wib.getSeconds()).padStart(2, '0');
  return `${hh}:${mi}:${ss}`;
}

export function getWIBDateStringDaysAgo(days: number): string {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return getWIBDateString(past);
}

