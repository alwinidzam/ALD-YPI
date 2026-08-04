export class AttendanceDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnknownBarcodeError extends AttendanceDomainError {
  constructor(barcodeToken: string) {
    super(`Unknown barcode token: ${barcodeToken}`);
  }
}

export class InactiveStaffError extends AttendanceDomainError {
  constructor(staffId: string) {
    super(`Staff is not active. ID: ${staffId}`);
  }
}

export class DuplicateAttendanceError extends AttendanceDomainError {
  constructor(staffId: string, date: string) {
    super(`Duplicate attendance entry for staff ${staffId} on ${date}`);
  }
}

export class InvalidAttendanceTransitionError extends AttendanceDomainError {
  constructor(fromStatus: string, toStatus: string) {
    super(`Invalid attendance state transition from ${fromStatus} to ${toStatus}`);
  }
}

export class ManualApprovalRequiredError extends AttendanceDomainError {
  constructor() {
    super('Manual attendance requires approval metadata (reason, approver).');
  }
}

export class ValidationFailedError extends AttendanceDomainError {
  public errors: string[];
  constructor(errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.errors = errors;
  }
}
