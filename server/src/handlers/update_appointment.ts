
import { db } from '../db';
import { appointmentsTable } from '../db/schema';
import { type UpdateAppointmentInput, type Appointment } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAppointment = async (input: UpdateAppointmentInput): Promise<Appointment> => {
  try {
    // Build the update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (input.appointment_date !== undefined) {
      updateData['appointment_date'] = input.appointment_date;
    }
    
    if (input.start_time !== undefined) {
      updateData['start_time'] = input.start_time;
    }
    
    if (input.status !== undefined) {
      updateData['status'] = input.status;
    }
    
    if (input.notes !== undefined) {
      updateData['notes'] = input.notes;
    }

    // Always update the updated_at timestamp
    updateData['updated_at'] = new Date();

    // Update the appointment record
    const result = await db.update(appointmentsTable)
      .set(updateData)
      .where(eq(appointmentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Appointment with id ${input.id} not found`);
    }

    // Convert date field from string to Date object for return
    const appointment = result[0];
    return {
      ...appointment,
      appointment_date: new Date(appointment.appointment_date)
    };
  } catch (error) {
    console.error('Appointment update failed:', error);
    throw error;
  }
};
