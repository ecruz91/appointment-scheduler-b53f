
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { appointmentsTable, customersTable, staffTable, servicesTable } from '../db/schema';
import { type CreateAppointmentInput } from '../schema';
import { createAppointment } from '../handlers/create_appointment';
import { eq } from 'drizzle-orm';

describe('createAppointment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create prerequisite data
  const createPrerequisites = async () => {
    // Create staff member
    const staffResult = await db.insert(staffTable)
      .values({
        email: 'staff@test.com',
        first_name: 'John',
        last_name: 'Staff',
        phone: '555-0100',
        role: 'staff'
      })
      .returning()
      .execute();

    // Create service
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Haircut',
        description: 'Basic haircut service',
        duration_minutes: 60,
        price: '25.00'
      })
      .returning()
      .execute();

    // Create customer
    const customerResult = await db.insert(customersTable)
      .values({
        email: 'customer@test.com',
        first_name: 'Jane',
        last_name: 'Customer',
        phone: '555-0200'
      })
      .returning()
      .execute();

    return {
      staff: staffResult[0],
      service: serviceResult[0],
      customer: customerResult[0]
    };
  };

  it('should create appointment with customer', async () => {
    const { staff, service, customer } = await createPrerequisites();

    const testInput: CreateAppointmentInput = {
      customer_id: customer.id,
      staff_id: staff.id,
      service_id: service.id,
      guest_email: null,
      guest_first_name: null,
      guest_last_name: null,
      guest_phone: null,
      appointment_date: new Date('2024-12-20'),
      start_time: '10:00',
      notes: 'Regular appointment'
    };

    const result = await createAppointment(testInput);

    expect(result.customer_id).toEqual(customer.id);
    expect(result.staff_id).toEqual(staff.id);
    expect(result.service_id).toEqual(service.id);
    expect(result.appointment_date).toEqual(new Date('2024-12-20'));
    expect(result.start_time).toEqual('10:00');
    expect(result.end_time).toEqual('11:00'); // 60 minutes duration
    expect(result.status).toEqual('scheduled');
    expect(result.notes).toEqual('Regular appointment');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create appointment with guest details', async () => {
    const { staff, service } = await createPrerequisites();

    const testInput: CreateAppointmentInput = {
      customer_id: null,
      staff_id: staff.id,
      service_id: service.id,
      guest_email: 'guest@test.com',
      guest_first_name: 'Guest',
      guest_last_name: 'User',
      guest_phone: '555-0300',
      appointment_date: new Date('2024-12-21'),
      start_time: '14:30',
      notes: null
    };

    const result = await createAppointment(testInput);

    expect(result.customer_id).toBeNull();
    expect(result.guest_email).toEqual('guest@test.com');
    expect(result.guest_first_name).toEqual('Guest');
    expect(result.guest_last_name).toEqual('User');
    expect(result.guest_phone).toEqual('555-0300');
    expect(result.start_time).toEqual('14:30');
    expect(result.end_time).toEqual('15:30'); // 60 minutes duration
  });

  it('should calculate end time correctly for different durations', async () => {
    const { staff, customer } = await createPrerequisites();

    // Create service with 90 minute duration
    const longServiceResult = await db.insert(servicesTable)
      .values({
        name: 'Color Treatment',
        description: 'Hair coloring service',
        duration_minutes: 90,
        price: '75.00'
      })
      .returning()
      .execute();

    const testInput: CreateAppointmentInput = {
      customer_id: customer.id,
      staff_id: staff.id,
      service_id: longServiceResult[0].id,
      guest_email: null,
      guest_first_name: null,
      guest_last_name: null,
      guest_phone: null,
      appointment_date: new Date('2024-12-22'),
      start_time: '09:15',
      notes: null
    };

    const result = await createAppointment(testInput);

    expect(result.start_time).toEqual('09:15');
    expect(result.end_time).toEqual('10:45'); // 90 minutes later
  });

  it('should save appointment to database', async () => {
    const { staff, service, customer } = await createPrerequisites();

    const testInput: CreateAppointmentInput = {
      customer_id: customer.id,
      staff_id: staff.id,
      service_id: service.id,
      guest_email: null,
      guest_first_name: null,
      guest_last_name: null,
      guest_phone: null,
      appointment_date: new Date('2024-12-23'),
      start_time: '16:00',
      notes: 'Database test'
    };

    const result = await createAppointment(testInput);

    const appointments = await db.select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, result.id))
      .execute();

    expect(appointments).toHaveLength(1);
    expect(appointments[0].customer_id).toEqual(customer.id);
    expect(appointments[0].staff_id).toEqual(staff.id);
    expect(appointments[0].service_id).toEqual(service.id);
    expect(new Date(appointments[0].appointment_date)).toEqual(new Date('2024-12-23'));
    expect(appointments[0].start_time.substring(0, 5)).toEqual('16:00'); // Format HH:MM:SS to HH:MM
    expect(appointments[0].end_time.substring(0, 5)).toEqual('17:00'); // Format HH:MM:SS to HH:MM
    expect(appointments[0].status).toEqual('scheduled');
    expect(appointments[0].notes).toEqual('Database test');
  });

  it('should throw error for non-existent staff', async () => {
    const { service, customer } = await createPrerequisites();

    const testInput: CreateAppointmentInput = {
      customer_id: customer.id,
      staff_id: 999,
      service_id: service.id,
      guest_email: null,
      guest_first_name: null,
      guest_last_name: null,
      guest_phone: null,
      appointment_date: new Date('2024-12-24'),
      start_time: '10:00',
      notes: null
    };

    await expect(createAppointment(testInput)).rejects.toThrow(/Staff with ID 999 not found/i);
  });

  it('should throw error for non-existent service', async () => {
    const { staff, customer } = await createPrerequisites();

    const testInput: CreateAppointmentInput = {
      customer_id: customer.id,
      staff_id: staff.id,
      service_id: 999,
      guest_email: null,
      guest_first_name: null,
      guest_last_name: null,
      guest_phone: null,
      appointment_date: new Date('2024-12-25'),
      start_time: '10:00',
      notes: null
    };

    await expect(createAppointment(testInput)).rejects.toThrow(/Service with ID 999 not found/i);
  });

  it('should throw error for non-existent customer', async () => {
    const { staff, service } = await createPrerequisites();

    const testInput: CreateAppointmentInput = {
      customer_id: 999,
      staff_id: staff.id,
      service_id: service.id,
      guest_email: null,
      guest_first_name: null,
      guest_last_name: null,
      guest_phone: null,
      appointment_date: new Date('2024-12-26'),
      start_time: '10:00',
      notes: null
    };

    await expect(createAppointment(testInput)).rejects.toThrow(/Customer with ID 999 not found/i);
  });
});
