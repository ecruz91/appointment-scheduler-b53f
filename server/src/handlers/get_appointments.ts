
import { db } from '../db';
import { appointmentsTable } from '../db/schema';
import { type GetAppointmentsInput, type Appointment } from '../schema';
import { eq, and, gte, lte, type SQL } from 'drizzle-orm';

export const getAppointments = async (input: GetAppointmentsInput): Promise<Appointment[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (input.staff_id !== undefined) {
      conditions.push(eq(appointmentsTable.staff_id, input.staff_id));
    }

    if (input.customer_id !== undefined) {
      conditions.push(eq(appointmentsTable.customer_id, input.customer_id));
    }

    if (input.date_from !== undefined) {
      // Convert Date to ISO date string (YYYY-MM-DD format)
      const dateFromString = input.date_from.toISOString().split('T')[0];
      conditions.push(gte(appointmentsTable.appointment_date, dateFromString));
    }

    if (input.date_to !== undefined) {
      // Convert Date to ISO date string (YYYY-MM-DD format)
      const dateToString = input.date_to.toISOString().split('T')[0];
      conditions.push(lte(appointmentsTable.appointment_date, dateToString));
    }

    if (input.status !== undefined) {
      conditions.push(eq(appointmentsTable.status, input.status));
    }

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await db.select()
          .from(appointmentsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(appointmentsTable)
          .execute();

    // Convert date strings back to Date objects for the response
    return results.map(appointment => ({
      ...appointment,
      appointment_date: new Date(appointment.appointment_date),
      created_at: appointment.created_at,
      updated_at: appointment.updated_at
    }));
  } catch (error) {
    console.error('Get appointments failed:', error);
    throw error;
  }
};
