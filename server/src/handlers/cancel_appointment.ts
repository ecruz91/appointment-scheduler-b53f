
import { db } from '../db';
import { appointmentsTable } from '../db/schema';
import { type Appointment } from '../schema';
import { eq } from 'drizzle-orm';

export const cancelAppointment = async (appointmentId: number): Promise<Appointment> => {
  try {
    // Update appointment status to cancelled
    const result = await db.update(appointmentsTable)
      .set({ 
        status: 'cancelled',
        updated_at: new Date()
      })
      .where(eq(appointmentsTable.id, appointmentId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Appointment with id ${appointmentId} not found`);
    }

    const appointment = result[0];

    return {
      ...appointment,
      appointment_date: new Date(appointment.appointment_date) // Convert string to Date
    };
  } catch (error) {
    console.error('Appointment cancellation failed:', error);
    throw error;
  }
};
