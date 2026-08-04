export class AttendanceUtils {
  static generateAttendanceId(staffId: string, dateString: string): string {
    return `${staffId}_${dateString}`;
  }

  static getWIBDateString(date: Date = new Date()): string {
    // Return YYYY-MM-DD in WIB (UTC+7)
    const wibTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return wibTime.toISOString().split('T')[0];
  }

  static calculateDurationMs(checkIn: Date, checkOut: Date): number {
    return Math.max(0, checkOut.getTime() - checkIn.getTime());
  }

  static generateEventId(): string {
    return crypto.randomUUID();
  }
}
