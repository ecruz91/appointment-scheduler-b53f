
import { db } from '../db';
import { appointmentsTable, servicesTable, staffTable, customersTable } from '../db/schema';
import { type CreateAppointmentInput, type Appointment } from '../schema';
import { eq } from 'drizzle-orm';

export const createAppointment = async (input: CreateAppointmentInput): Promise<Appointment> => {
  try {
    // Validate staff exists
    const staff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, input.staff_id))
      .execute();
    
    if (!staff.length) {
      throw new Error(`Staff with ID ${input.staff_id} not found`);
    }

    // Validate service exists
    const service = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, input.service_id))
      .execute();
    
    if (!service.length) {
      throw new Error(`Service with ID ${input.service_id} not found`);
    }

    // If customer_id provided, validate customer exists
    if (input.customer_id) {
      const customer = await db.select()
        .from(customersTable)
        .where(eq(customersTable.id, input.customer_id))
        .execute();
      
      if (!customer.length) {
        throw new Error(`Customer with ID ${input.customer_id} not found`);
      }
    }

    // Calculate end time based on service duration
    const serviceDuration = service[0].duration_minutes;
    const [startHour, startMinute] = input.start_time.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = startTimeInMinutes + serviceDuration;
    const endHour = Math.floor(endTimeInMinutes / 60);
    const endMinute = endTimeInMinutes % 60;
    const end_time = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    // Format date as YYYY-MM-DD string for the date column
    const appointmentDateString = input.appointment_date.toISOString().split('T')[0];

    // Insert appointment record
    const result = await db.insert(appointmentsTable)
      .values({
        customer_id: input.customer_id,
        staff_id: input.staff_id,
        service_id: input.service_id,
        guest_email: input.guest_email,
        guest_first_name: input.guest_first_name,
        guest_last_name: input.guest_last_name,
        guest_phone: input.guest_phone,
        appointment_date: appointmentDateString,
        start_time: input.start_time,
        end_time: end_time,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert appointment_date back to Date object and format time fields
    const appointment = result[0];
    return {
      ...appointment,
      appointment_date: new Date(appointment.appointment_date),
      start_time: appointment.start_time.substring(0, 5), // Convert HH:MM:SS to HH:MM
      end_time: appointment.end_time.substring(0, 5) // Convert HH:MM:SS to HH:MM
    };
  } catch (error) {
    console.error('Appointment creation failed:', error);
    throw error;
  }
};
