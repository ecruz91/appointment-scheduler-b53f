
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, staffTable, servicesTable, appointmentsTable } from '../db/schema';
import { type UpdateAppointmentInput } from '../schema';
import { updateAppointment } from '../handlers/update_appointment';
import { eq } from 'drizzle-orm';

describe('updateAppointment', () => {
  let customerId: number;
  let staffId: number;
  let serviceId: number;
  let appointmentId: number;

  beforeEach(async () => {
    await createDB();

    // Create prerequisite data
    const customerResult = await db.insert(customersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0123'
      })
      .returning()
      .execute();
    customerId = customerResult[0].id;

    const staffResult = await db.insert(staffTable)
      .values({
        email: 'staff@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '555-0456',
        role: 'staff'
      })
      .returning()
      .execute();
    staffId = staffResult[0].id;

    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Haircut',
        description: 'Professional haircut',
        duration_minutes: 30,
        price: '25.00'
      })
      .returning()
      .execute();
    serviceId = serviceResult[0].id;

    // Create initial appointment - date column expects string format
    const appointmentResult = await db.insert(appointmentsTable)
      .values({
        customer_id: customerId,
        staff_id: staffId,
        service_id: serviceId,
        appointment_date: '2024-03-15',
        start_time: '10:00',
        end_time: '10:30',
        status: 'scheduled',
        notes: 'Initial notes'
      })
      .returning()
      .execute();
    appointmentId = appointmentResult[0].id;
  });

  afterEach(resetDB);

  it('should update appointment date', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      appointment_date: new Date('2024-03-20')
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.appointment_date).toEqual(new Date('2024-03-20'));
    expect(result.start_time).toEqual('10:00:00'); // PostgreSQL time format includes seconds
    expect(result.status).toEqual('scheduled'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update appointment start time', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      start_time: '14:30'
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.start_time).toEqual('14:30:00'); // PostgreSQL time format includes seconds
    expect(result.appointment_date).toEqual(new Date('2024-03-15')); // Unchanged
    expect(result.status).toEqual('scheduled'); // Unchanged
  });

  it('should update appointment status', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      status: 'confirmed'
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.status).toEqual('confirmed');
    expect(result.appointment_date).toEqual(new Date('2024-03-15')); // Unchanged
    expect(result.start_time).toEqual('10:00:00'); // PostgreSQL time format includes seconds
  });

  it('should update appointment notes', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      notes: 'Updated notes with special instructions'
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.notes).toEqual('Updated notes with special instructions');
    expect(result.status).toEqual('scheduled'); // Unchanged
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      appointment_date: new Date('2024-03-25'),
      start_time: '16:00',
      status: 'completed',
      notes: 'Appointment completed successfully'
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.appointment_date).toEqual(new Date('2024-03-25'));
    expect(result.start_time).toEqual('16:00:00'); // PostgreSQL time format includes seconds
    expect(result.status).toEqual('completed');
    expect(result.notes).toEqual('Appointment completed successfully');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated appointment to database', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      status: 'cancelled',
      notes: 'Customer cancelled'
    };

    await updateAppointment(updateInput);

    // Verify changes were persisted
    const appointments = await db.select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, appointmentId))
      .execute();

    expect(appointments).toHaveLength(1);
    expect(appointments[0].status).toEqual('cancelled');
    expect(appointments[0].notes).toEqual('Customer cancelled');
    expect(appointments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent appointment', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: 999999,
      status: 'confirmed'
    };

    await expect(updateAppointment(updateInput)).rejects.toThrow(/Appointment with id 999999 not found/i);
  });

  it('should handle null notes update', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      notes: null
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.notes).toBeNull();
  });
});
