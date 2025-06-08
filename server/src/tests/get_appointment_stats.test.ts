
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, staffTable, servicesTable, appointmentsTable } from '../db/schema';
import { getAppointmentStats } from '../handlers/get_appointment_stats';

describe('getAppointmentStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return stats for all appointments when no filters provided', async () => {
    // Create test data
    const customer = await db.insert(customersTable)
      .values({
        email: 'customer@test.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '1234567890'
      })
      .returning()
      .execute();

    const staff = await db.insert(staffTable)
      .values({
        email: 'staff@test.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'staff'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Haircut',
        duration_minutes: 60,
        price: '50.00'
      })
      .returning()
      .execute();

    // Create appointments with different statuses
    await db.insert(appointmentsTable)
      .values([
        {
          customer_id: customer[0].id,
          staff_id: staff[0].id,
          service_id: service[0].id,
          appointment_date: '2024-01-15',
          start_time: '10:00',
          end_time: '11:00',
          status: 'completed'
        },
        {
          customer_id: customer[0].id,
          staff_id: staff[0].id,
          service_id: service[0].id,
          appointment_date: '2024-01-16',
          start_time: '14:00',
          end_time: '15:00',
          status: 'cancelled'
        },
        {
          customer_id: customer[0].id,
          staff_id: staff[0].id,
          service_id: service[0].id,
          appointment_date: '2024-01-17',
          start_time: '09:00',
          end_time: '10:00',
          status: 'scheduled'
        }
      ])
      .execute();

    const result = await getAppointmentStats();

    expect(result.total_appointments).toEqual(3);
    expect(result.completed_appointments).toEqual(1);
    expect(result.cancelled_appointments).toEqual(1);
    expect(result.revenue).toEqual(50.0); // Only completed appointments count for revenue
  });

  it('should filter by staff_id', async () => {
    // Create test data
    const customer = await db.insert(customersTable)
      .values({
        email: 'customer@test.com',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const staff1 = await db.insert(staffTable)
      .values({
        email: 'staff1@test.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'staff'
      })
      .returning()
      .execute();

    const staff2 = await db.insert(staffTable)
      .values({
        email: 'staff2@test.com',
        first_name: 'Bob',
        last_name: 'Johnson',
        role: 'staff'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Massage',
        duration_minutes: 90,
        price: '80.00'
      })
      .returning()
      .execute();

    // Create appointments for different staff
    await db.insert(appointmentsTable)
      .values([
        {
          customer_id: customer[0].id,
          staff_id: staff1[0].id,
          service_id: service[0].id,
          appointment_date: '2024-01-15',
          start_time: '10:00',
          end_time: '11:30',
          status: 'completed'
        },
        {
          customer_id: customer[0].id,
          staff_id: staff2[0].id,
          service_id: service[0].id,
          appointment_date: '2024-01-16',
          start_time: '14:00',
          end_time: '15:30',
          status: 'completed'
        }
      ])
      .execute();

    const result = await getAppointmentStats(staff1[0].id);

    expect(result.total_appointments).toEqual(1);
    expect(result.completed_appointments).toEqual(1);
    expect(result.cancelled_appointments).toEqual(0);
    expect(result.revenue).toEqual(80.0);
  });

  it('should filter by date range', async () => {
    // Create test data
    const customer = await db.insert(customersTable)
      .values({
        email: 'customer@test.com',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const staff = await db.insert(staffTable)
      .values({
        email: 'staff@test.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'staff'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Consultation',
        duration_minutes: 30,
        price: '25.00'
      })
      .returning()
      .execute();

    // Create appointments on different dates
    await db.insert(appointmentsTable)
      .values([
        {
          customer_id: customer[0].id,
          staff_id: staff[0].id,
          service_id: service[0].id,
          appointment_date: '2024-01-10',
          start_time: '10:00',
          end_time: '10:30',
          status: 'completed'
        },
        {
          customer_id: customer[0].id,
          staff_id: staff[0].id,
          service_id: service[0].id,
          appointment_date: '2024-01-20',
          start_time: '14:00',
          end_time: '14:30',
          status: 'completed'
        },
        {
          customer_id: customer[0].id,
          staff_id: staff[0].id,
          service_id: service[0].id,
          appointment_date: '2024-01-30',
          start_time: '16:00',
          end_time: '16:30',
          status: 'completed'
        }
      ])
      .execute();

    const result = await getAppointmentStats(
      undefined,
      new Date('2024-01-15'),
      new Date('2024-01-25')
    );

    expect(result.total_appointments).toEqual(1);
    expect(result.completed_appointments).toEqual(1);
    expect(result.cancelled_appointments).toEqual(0);
    expect(result.revenue).toEqual(25.0);
  });

  it('should return zero stats when no appointments match filters', async () => {
    // Create test data but no matching appointments
    const staff = await db.insert(staffTable)
      .values({
        email: 'staff@test.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'staff'
      })
      .returning()
      .execute();

    const result = await getAppointmentStats(staff[0].id);

    expect(result.total_appointments).toEqual(0);
    expect(result.completed_appointments).toEqual(0);
    expect(result.cancelled_appointments).toEqual(0);
    expect(result.revenue).toEqual(0);
  });

  it('should handle multiple filters combined', async () => {
    // Create test data
    const customer = await db.insert(customersTable)
      .values({
        email: 'customer@test.com',
        first_name: 'John',
        last_name: 'Doe'
      })
      .returning()
      .execute();

    const staff1 = await db.insert(staffTable)
      .values({
        email: 'staff1@test.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'staff'
      })
      .returning()
      .execute();

    const staff2 = await db.insert(staffTable)
      .values({
        email: 'staff2@test.com',
        first_name: 'Bob',
        last_name: 'Johnson',
        role: 'staff'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Treatment',
        duration_minutes: 45,
        price: '60.00'
      })
      .returning()
      .execute();

    // Create appointments for different staff and dates
    await db.insert(appointmentsTable)
      .values([
        {
          customer_id: customer[0].id,
          staff_id: staff1[0].id,
          service_id: service[0].id,
          appointment_date: '2024-01-15',
          start_time: '10:00',
          end_time: '10:45',
          status: 'completed'
        },
        {
          customer_id: customer[0].id,
          staff_id: staff1[0].id,
          service_id: service[0].id,
          appointment_date: '2024-01-25',
          start_time: '14:00',
          end_time: '14:45',
          status: 'cancelled'
        },
        {
          customer_id: customer[0].id,
          staff_id: staff2[0].id,
          service_id: service[0].id,
          appointment_date: '2024-01-15',
          start_time: '16:00',
          end_time: '16:45',
          status: 'completed'
        }
      ])
      .execute();

    const result = await getAppointmentStats(
      staff1[0].id,
      new Date('2024-01-10'),
      new Date('2024-01-20')
    );

    expect(result.total_appointments).toEqual(1);
    expect(result.completed_appointments).toEqual(1);
    expect(result.cancelled_appointments).toEqual(0);
    expect(result.revenue).toEqual(60.0);
  });
});
