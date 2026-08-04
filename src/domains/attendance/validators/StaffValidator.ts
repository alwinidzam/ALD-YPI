import { Staff } from '../types';
import { ValidationFailedError } from '../errors';

export class StaffValidator {
  static validateForCreate(staff: Omit<Staff, 'id'>): void {
    const errors: string[] = [];

    if (!staff.fullName || staff.fullName.trim().length === 0) {
      errors.push('Staff full name is required.');
    }

    if (!staff.institutions || staff.institutions.length === 0) {
      errors.push('At least one institution is required.');
    }

    if (!staff.primaryInstitution) {
      errors.push('Primary Institution is required.');
    }

    if (!staff.employmentType) {
      errors.push('Employment type is required.');
    }

    if (!staff.role) {
      errors.push('Staff role is required.');
    }

    if (!staff.position || staff.position.trim().length === 0) {
      errors.push('Position is required.');
    }

    if (!staff.createdBy) {
      errors.push('CreatedBy is required for audit logs.');
    }

    if (errors.length > 0) {
      throw new ValidationFailedError(errors);
    }
  }

  static validateForUpdate(staffUpdate: Partial<Omit<Staff, 'id'>>): void {
    const errors: string[] = [];

    if (staffUpdate.fullName !== undefined && staffUpdate.fullName.trim().length === 0) {
      errors.push('Staff full name cannot be empty.');
    }

    if (staffUpdate.position !== undefined && staffUpdate.position.trim().length === 0) {
      errors.push('Position cannot be empty.');
    }
    
    if (staffUpdate.isDeleted) {
       errors.push('Cannot update soft-delete status directly via update. Use softDelete method.');
    }

    if (errors.length > 0) {
      throw new ValidationFailedError(errors);
    }
  }
}
