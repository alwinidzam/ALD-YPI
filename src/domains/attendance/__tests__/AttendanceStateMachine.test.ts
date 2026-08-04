import { describe, it, expect } from 'vitest';
import { AttendanceStateMachine } from '../state/AttendanceStateMachine';
import { InvalidAttendanceTransitionError } from '../errors';
import { AttendanceStatus } from '../types';

describe('AttendanceStateMachine', () => {
  it('should allow valid transitions', () => {
    expect(() => AttendanceStateMachine.validateTransition(null, 'READY')).not.toThrow();
    expect(() => AttendanceStateMachine.validateTransition(null, 'CHECKED_IN')).not.toThrow();
    expect(() => AttendanceStateMachine.validateTransition(null, 'MANUAL')).not.toThrow();
    expect(() => AttendanceStateMachine.validateTransition('READY', 'CHECKED_IN')).not.toThrow();
    expect(() => AttendanceStateMachine.validateTransition('READY', 'MANUAL')).not.toThrow();
    expect(() => AttendanceStateMachine.validateTransition('CHECKED_IN', 'CHECKED_OUT')).not.toThrow();
    expect(() => AttendanceStateMachine.validateTransition('CHECKED_IN', 'MANUAL')).not.toThrow();
    expect(() => AttendanceStateMachine.validateTransition('CHECKED_OUT', 'COMPLETED')).not.toThrow();
    expect(() => AttendanceStateMachine.validateTransition('MANUAL', 'COMPLETED')).not.toThrow();
  });

  it('should throw InvalidAttendanceTransitionError for invalid transitions', () => {
    expect(() => AttendanceStateMachine.validateTransition('INITIAL' as any, 'COMPLETED')).toThrow(InvalidAttendanceTransitionError);
    expect(() => AttendanceStateMachine.validateTransition('CHECKED_IN', 'READY')).toThrow(InvalidAttendanceTransitionError);
    expect(() => AttendanceStateMachine.validateTransition('COMPLETED', 'READY')).toThrow(InvalidAttendanceTransitionError);
  });

  it('should not throw if fromStatus equals toStatus', () => {
    expect(() => AttendanceStateMachine.validateTransition('CHECKED_IN', 'CHECKED_IN')).not.toThrow();
  });
});
