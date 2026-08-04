import { describe, it, expect } from 'vitest';
import { AttendanceUtils } from '../utils/AttendanceUtils';

describe('AttendanceUtils', () => {
  it('generateAttendanceId should format correctly', () => {
    expect(AttendanceUtils.generateAttendanceId('S1', '2023-10-10')).toBe('S1_2023-10-10');
  });

  it('getWIBDateString should return expected string format based on UTC time', () => {
    // 00:00:00 UTC -> 07:00:00 WIB
    const date = new Date('2023-10-10T00:00:00Z');
    expect(AttendanceUtils.getWIBDateString(date)).toBe('2023-10-10');
    
    // 20:00:00 UTC -> next day 03:00:00 WIB
    const lateDate = new Date('2023-10-10T20:00:00Z');
    expect(AttendanceUtils.getWIBDateString(lateDate)).toBe('2023-10-11');
  });

  it('calculateDurationMs should return the correct duration', () => {
    const checkIn = new Date('2023-10-10T07:00:00Z');
    const checkOut = new Date('2023-10-10T16:00:00Z');
    expect(AttendanceUtils.calculateDurationMs(checkIn, checkOut)).toBe(9 * 60 * 60 * 1000);
  });

  it('calculateDurationMs should not return negative', () => {
    const checkIn = new Date('2023-10-10T16:00:00Z');
    const checkOut = new Date('2023-10-10T07:00:00Z');
    expect(AttendanceUtils.calculateDurationMs(checkIn, checkOut)).toBe(0);
  });

  it('generateEventId should return a UUID string', () => {
    const id = AttendanceUtils.generateEventId();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });
});
