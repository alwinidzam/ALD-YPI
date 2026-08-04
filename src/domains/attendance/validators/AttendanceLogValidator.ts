import { AttendanceLog } from '../types';
import { ValidationFailedError } from '../errors';

export class AttendanceLogValidator {
  static validateForCreate(log: Omit<AttendanceLog, 'id'>): void {
    const errors: string[] = [];

    if (!log.action) errors.push('Action is required.');
    if (!log.operatorId) errors.push('Operator ID is required.');
    if (!log.operatorNameSnapshot) errors.push('Operator name snapshot is required.');
    if (!log.validationResult) errors.push('Validation result is required.');
    
    if (log.validationResult !== 'VALID' && !log.failureReason) {
      errors.push('Failure reason is required when validation is not VALID.');
    }

    if (errors.length > 0) {
      throw new ValidationFailedError(errors);
    }
  }
}
