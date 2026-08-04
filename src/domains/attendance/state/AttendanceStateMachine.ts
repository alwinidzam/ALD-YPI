import { AttendanceStatus } from '../types';
import { InvalidAttendanceTransitionError } from '../errors';

export class AttendanceStateMachine {
  static validateTransition(fromStatus: AttendanceStatus | null, toStatus: AttendanceStatus): void {
    if (fromStatus === toStatus) return;

    const allowedTransitions: Record<string, AttendanceStatus[]> = {
      'INITIAL': ['READY', 'CHECKED_IN', 'MANUAL'],
      'READY': ['CHECKED_IN', 'MANUAL'],
      'CHECKED_IN': ['CHECKED_OUT', 'INCOMPLETE', 'MANUAL'],
      'CHECKED_OUT': ['COMPLETED', 'MANUAL'],
      'MANUAL': ['CHECKED_OUT', 'COMPLETED', 'MANUAL'],
      'INCOMPLETE': ['COMPLETED', 'MANUAL'],
      'COMPLETED': [],
      'INVALID': [],
      'DUPLICATE': [],
      'CANCELLED': []
    };

    const current = fromStatus || 'INITIAL';
    
    if (!allowedTransitions[current]?.includes(toStatus)) {
      throw new InvalidAttendanceTransitionError(current, toStatus);
    }
  }
}
