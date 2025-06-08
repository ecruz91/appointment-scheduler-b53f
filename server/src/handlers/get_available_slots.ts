
import { db } from '../db';
import { staffAvailabilityTable, appointmentsTable, servicesTable, staffServicesTable } from '../db/schema';
import { type GetAvailableSlotsInput, type AvailableSlot } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getAvailableSlots = async (input: GetAvailableSlotsInput): Promise<AvailableSlot[]> => {
  try {
    // Get the day of the week for the requested date
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[input.date.getDay()] as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

    // Get service duration
    const service = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, input.service_id))
      .execute();

    if (service.length === 0) {
      throw new Error('Service not found');
    }

    const serviceDuration = service[0].duration_minutes;

    // Check if staff can provide this service
    const staffService = await db.select()
      .from(staffServicesTable)
      .where(and(
        eq(staffServicesTable.staff_id, input.staff_id),
        eq(staffServicesTable.service_id, input.service_id)
      ))
      .execute();

    if (staffService.length === 0) {
      throw new Error('Staff member cannot provide this service');
    }

    // Get staff availability for the day
    const availability = await db.select()
      .from(staffAvailabilityTable)
      .where(and(
        eq(staffAvailabilityTable.staff_id, input.staff_id),
        eq(staffAvailabilityTable.day_of_week, dayOfWeek),
        eq(staffAvailabilityTable.is_active, true)
      ))
      .execute();

    if (availability.length === 0) {
      return [];
    }

    // Get existing appointments for the staff member on that date
    const appointments = await db.select()
      .from(appointmentsTable)
      .where(and(
        eq(appointmentsTable.staff_id, input.staff_id),
        eq(appointmentsTable.appointment_date, input.date.toISOString().split('T')[0])
      ))
      .execute();

    const availableSlots: AvailableSlot[] = [];

    // For each availability window, generate possible slots
    for (const window of availability) {
      const startTime = window.start_time;
      const endTime = window.end_time;

      // Convert time strings to minutes for easier calculation
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);

      // Generate 15-minute slots within the availability window
      for (let currentMinutes = startMinutes; currentMinutes + serviceDuration <= endMinutes; currentMinutes += 15) {
        const slotStart = minutesToTime(currentMinutes);
        const slotEnd = minutesToTime(currentMinutes + serviceDuration);

        // Check if this slot conflicts with existing appointments
        const hasConflict = appointments.some(appointment => {
          const appointmentStart = timeToMinutes(appointment.start_time);
          const appointmentEnd = timeToMinutes(appointment.end_time);
          const proposedStart = currentMinutes;
          const proposedEnd = currentMinutes + serviceDuration;

          // Check for overlap
          return (proposedStart < appointmentEnd && proposedEnd > appointmentStart);
        });

        if (!hasConflict) {
          availableSlots.push({
            start_time: slotStart,
            end_time: slotEnd
          });
        }
      }
    }

    return availableSlots;
  } catch (error) {
    console.error('Get available slots failed:', error);
    throw error;
  }
};

// Helper function to convert time string (HH:MM) to minutes
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to convert minutes to time string (HH:MM)
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
