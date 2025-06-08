
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { appointmentsTable, customersTable, staffTable, servicesTable } from '../db/schema';
import { cancelAppointment } from '../handlers/cancel_appointment';
import { eq } from 'drizzle-orm';

describe('cancelAppointment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should cancel an appointment', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0123'
      })
      .returning()
      .execute();

    const staff = await db.insert(staffTable)
      .values({
        email: 'staff@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '555-0456',
        role: 'staff'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        description: 'A test service',
        duration_minutes: 60,
        price: '50.00'
      })
      .returning()
      .execute();

    // Create appointment
    const appointment = await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-15',
        start_time: '10:00',
        end_time: '11:00',
        status: 'scheduled'
      })
      .returning()
      .execute();

    const result = await cancelAppointment(appointment[0].id);

    // Verify appointment was cancelled
    expect(result.id).toEqual(appointment[0].id);
    expect(result.status).toEqual('cancelled');
    expect(result.customer_id).toEqual(customer[0].id);
    expect(result.staff_id).toEqual(staff[0].id);
    expect(result.service_id).toEqual(service[0].id);
    expect(result.appointment_date).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save cancellation to database', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0123'
      })
      .returning()
      .execute();

    const staff = await db.insert(staffTable)
      .values({
        email: 'staff@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '555-0456',
        role: 'staff'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        description: 'A test service',
        duration_minutes: 60,
        price: '50.00'
      })
      .returning()
      .execute();

    // Create appointment
    const appointment = await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-15',
        start_time: '10:00',
        end_time: '11:00',
        status: 'confirmed'
      })
      .returning()
      .execute();

    await cancelAppointment(appointment[0].id);

    // Verify in database
    const appointments = await db.select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, appointment[0].id))
      .execute();

    expect(appointments).toHaveLength(1);
    expect(appointments[0].status).toEqual('cancelled');
    expect(appointments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent appointment', async () => {
    await expect(cancelAppointment(999)).rejects.toThrow(/not found/i);
  });

  it('should cancel guest appointment without customer', async () => {
    // Create prerequisite data
    const staff = await db.insert(staffTable)
      .values({
        email: 'staff@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '555-0456',
        role: 'staff'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        description: 'A test service',
        duration_minutes: 60,
        price: '50.00'
      })
      .returning()
      .execute();

    // Create guest appointment (no customer_id)
    const appointment = await db.insert(appointmentsTable)
      .values({
        customer_id: null,
        staff_id: staff[0].id,
        service_id: service[0].id,
        guest_email: 'guest@example.com',
        guest_first_name: 'Guest',
        guest_last_name: 'User',
        guest_phone: '555-0789',
        appointment_date: '2024-01-15',
        start_time: '10:00',
        end_time: '11:00',
        status: 'scheduled'
      })
      .returning()
      .execute();

    const result = await cancelAppointment(appointment[0].id);

    expect(result.id).toEqual(appointment[0].id);
    expect(result.status).toEqual('cancelled');
    expect(result.customer_id).toBeNull();
    expect(result.guest_email).toEqual('guest@example.com');
    expect(result.guest_first_name).toEqual('Guest');
    expect(result.guest_last_name).toEqual('User');
    expect(result.appointment_date).toBeInstanceOf(Date);
  });
});
