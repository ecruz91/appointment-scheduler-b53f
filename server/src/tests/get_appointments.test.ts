
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, staffTable, servicesTable, appointmentsTable } from '../db/schema';
import { type GetAppointmentsInput, type CreateCustomerInput, type CreateStaffInput, type CreateServiceInput } from '../schema';
import { getAppointments } from '../handlers/get_appointments';

// Test data
const testCustomer: CreateCustomerInput = {
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-0123'
};

const testStaff: CreateStaffInput = {
  email: 'staff@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  phone: '555-0456',
  role: 'staff'
};

const testService: CreateServiceInput = {
  name: 'Test Service',
  description: 'A test service',
  duration_minutes: 60,
  price: 100.00
};

describe('getAppointments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all appointments when no filters applied', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const staff = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        ...testService,
        price: testService.price.toString()
      })
      .returning()
      .execute();

    // Create test appointments
    const appointment1 = await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        status: 'scheduled'
      })
      .returning()
      .execute();

    const appointment2 = await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-16',
        start_time: '10:00',
        end_time: '11:00',
        status: 'confirmed'
      })
      .returning()
      .execute();

    const input: GetAppointmentsInput = {};
    const result = await getAppointments(input);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBeDefined();
    expect(result[0].appointment_date).toBeInstanceOf(Date);
    expect(result[0].start_time).toEqual('09:00:00');
    expect(result[0].status).toEqual('scheduled');
    expect(result[1].status).toEqual('confirmed');
  });

  it('should filter by staff_id', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const staff1 = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const staff2 = await db.insert(staffTable)
      .values({
        ...testStaff,
        email: 'staff2@example.com',
        first_name: 'Bob'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        ...testService,
        price: testService.price.toString()
      })
      .returning()
      .execute();

    // Create appointments for different staff
    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff1[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        status: 'scheduled'
      })
      .execute();

    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff2[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-16',
        start_time: '10:00',
        end_time: '11:00',
        status: 'confirmed'
      })
      .execute();

    const input: GetAppointmentsInput = {
      staff_id: staff1[0].id
    };
    const result = await getAppointments(input);

    expect(result).toHaveLength(1);
    expect(result[0].staff_id).toEqual(staff1[0].id);
    expect(result[0].status).toEqual('scheduled');
  });

  it('should filter by customer_id', async () => {
    // Create prerequisite data
    const customer1 = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const customer2 = await db.insert(customersTable)
      .values({
        ...testCustomer,
        email: 'customer2@example.com',
        first_name: 'Alice'
      })
      .returning()
      .execute();

    const staff = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        ...testService,
        price: testService.price.toString()
      })
      .returning()
      .execute();

    // Create appointments for different customers
    await db.insert(appointmentsTable)
      .values({
        customer_id: customer1[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        status: 'scheduled'
      })
      .execute();

    await db.insert(appointmentsTable)
      .values({
        customer_id: customer2[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-16',
        start_time: '10:00',
        end_time: '11:00',
        status: 'confirmed'
      })
      .execute();

    const input: GetAppointmentsInput = {
      customer_id: customer2[0].id
    };
    const result = await getAppointments(input);

    expect(result).toHaveLength(1);
    expect(result[0].customer_id).toEqual(customer2[0].id);
    expect(result[0].status).toEqual('confirmed');
  });

  it('should filter by date range', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const staff = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        ...testService,
        price: testService.price.toString()
      })
      .returning()
      .execute();

    // Create appointments on different dates
    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-10',
        start_time: '09:00',
        end_time: '10:00',
        status: 'scheduled'
      })
      .execute();

    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-15',
        start_time: '10:00',
        end_time: '11:00',
        status: 'confirmed'
      })
      .execute();

    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-20',
        start_time: '11:00',
        end_time: '12:00',
        status: 'completed'
      })
      .execute();

    const input: GetAppointmentsInput = {
      date_from: new Date('2024-01-12'),
      date_to: new Date('2024-01-18')
    };
    const result = await getAppointments(input);

    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('confirmed');
    expect(result[0].appointment_date.getTime()).toEqual(new Date('2024-01-15').getTime());
  });

  it('should filter by status', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const staff = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        ...testService,
        price: testService.price.toString()
      })
      .returning()
      .execute();

    // Create appointments with different statuses
    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        status: 'scheduled'
      })
      .execute();

    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-16',
        start_time: '10:00',
        end_time: '11:00',
        status: 'completed'
      })
      .execute();

    const input: GetAppointmentsInput = {
      status: 'completed'
    };
    const result = await getAppointments(input);

    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('completed');
  });

  it('should handle multiple filters', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const staff = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        ...testService,
        price: testService.price.toString()
      })
      .returning()
      .execute();

    // Create appointments
    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-15',
        start_time: '09:00',
        end_time: '10:00',
        status: 'scheduled'
      })
      .execute();

    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        staff_id: staff[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-15',
        start_time: '10:00',
        end_time: '11:00',
        status: 'completed'
      })
      .execute();

    const input: GetAppointmentsInput = {
      staff_id: staff[0].id,
      date_from: new Date('2024-01-15'),
      date_to: new Date('2024-01-15'),
      status: 'scheduled'
    };
    const result = await getAppointments(input);

    expect(result).toHaveLength(1);
    expect(result[0].staff_id).toEqual(staff[0].id);
    expect(result[0].status).toEqual('scheduled');
    expect(result[0].appointment_date.getTime()).toEqual(new Date('2024-01-15').getTime());
  });

  it('should return empty array when no appointments match filters', async () => {
    const input: GetAppointmentsInput = {
      staff_id: 999,
      status: 'completed'
    };
    const result = await getAppointments(input);

    expect(result).toHaveLength(0);
  });
});
