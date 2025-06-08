
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staffTable, servicesTable, staffAvailabilityTable, staffServicesTable, appointmentsTable } from '../db/schema';
import { type GetAvailableSlotsInput } from '../schema';
import { getAvailableSlots } from '../handlers/get_available_slots';

describe('getAvailableSlots', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return available slots for a staff member', async () => {
    // Create staff member
    const staffResult = await db.insert(staffTable)
      .values({
        email: 'staff@test.com',
        first_name: 'Staff',
        last_name: 'Member',
        role: 'staff'
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create service
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        duration_minutes: 60,
        price: '50.00'
      })
      .returning()
      .execute();

    const serviceId = serviceResult[0].id;

    // Link staff to service
    await db.insert(staffServicesTable)
      .values({
        staff_id: staffId,
        service_id: serviceId
      })
      .execute();

    // Create availability (Monday 9:00-17:00)
    await db.insert(staffAvailabilityTable)
      .values({
        staff_id: staffId,
        day_of_week: 'monday',
        start_time: '09:00',
        end_time: '17:00'
      })
      .execute();

    // Test on a Monday
    const testDate = new Date('2024-01-01'); // This is a Monday

    const input: GetAvailableSlotsInput = {
      staff_id: staffId,
      service_id: serviceId,
      date: testDate
    };

    const result = await getAvailableSlots(input);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].start_time).toEqual('09:00');
    expect(result[0].end_time).toEqual('10:00');

    // Verify slots are 15 minutes apart
    expect(result[1].start_time).toEqual('09:15');
    expect(result[1].end_time).toEqual('10:15');
  });

  it('should exclude slots that conflict with existing appointments', async () => {
    // Create staff member
    const staffResult = await db.insert(staffTable)
      .values({
        email: 'staff@test.com',
        first_name: 'Staff',
        last_name: 'Member',
        role: 'staff'
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create service
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        duration_minutes: 60,
        price: '50.00'
      })
      .returning()
      .execute();

    const serviceId = serviceResult[0].id;

    // Link staff to service
    await db.insert(staffServicesTable)
      .values({
        staff_id: staffId,
        service_id: serviceId
      })
      .execute();

    // Create availability (Monday 9:00-12:00)
    await db.insert(staffAvailabilityTable)
      .values({
        staff_id: staffId,
        day_of_week: 'monday',
        start_time: '09:00',
        end_time: '12:00'
      })
      .execute();

    // Create existing appointment (10:00-11:00)
    const testDate = new Date('2024-01-01'); // This is a Monday
    await db.insert(appointmentsTable)
      .values({
        staff_id: staffId,
        service_id: serviceId,
        guest_email: 'guest@test.com',
        guest_first_name: 'Guest',
        guest_last_name: 'User',
        appointment_date: testDate.toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '11:00'
      })
      .execute();

    const input: GetAvailableSlotsInput = {
      staff_id: staffId,
      service_id: serviceId,
      date: testDate
    };

    const result = await getAvailableSlots(input);

    // Should have slots before and after the appointment, but not during
    const conflictingSlots = result.filter(slot => 
      slot.start_time >= '10:00' && slot.start_time < '11:00'
    );

    expect(conflictingSlots.length).toEqual(0);

    // Should have slots at 9:00 and 11:00
    const nineAMSlot = result.find(slot => slot.start_time === '09:00');
    const elevenAMSlot = result.find(slot => slot.start_time === '11:00');

    expect(nineAMSlot).toBeDefined();
    expect(elevenAMSlot).toBeDefined();
  });

  it('should return empty array when staff has no availability for the day', async () => {
    // Create staff member
    const staffResult = await db.insert(staffTable)
      .values({
        email: 'staff@test.com',
        first_name: 'Staff',
        last_name: 'Member',
        role: 'staff'
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create service
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        duration_minutes: 60,
        price: '50.00'
      })
      .returning()
      .execute();

    const serviceId = serviceResult[0].id;

    // Link staff to service
    await db.insert(staffServicesTable)
      .values({
        staff_id: staffId,
        service_id: serviceId
      })
      .execute();

    // Create availability for Tuesday, but test on Monday
    await db.insert(staffAvailabilityTable)
      .values({
        staff_id: staffId,
        day_of_week: 'tuesday',
        start_time: '09:00',
        end_time: '17:00'
      })
      .execute();

    const testDate = new Date('2024-01-01'); // This is a Monday

    const input: GetAvailableSlotsInput = {
      staff_id: staffId,
      service_id: serviceId,
      date: testDate
    };

    const result = await getAvailableSlots(input);

    expect(result).toHaveLength(0);
  });

  it('should throw error when staff cannot provide the service', async () => {
    // Create staff member
    const staffResult = await db.insert(staffTable)
      .values({
        email: 'staff@test.com',
        first_name: 'Staff',
        last_name: 'Member',
        role: 'staff'
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create service but don't link to staff
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        duration_minutes: 60,
        price: '50.00'
      })
      .returning()
      .execute();

    const serviceId = serviceResult[0].id;

    const testDate = new Date('2024-01-01');

    const input: GetAvailableSlotsInput = {
      staff_id: staffId,
      service_id: serviceId,
      date: testDate
    };

    expect(getAvailableSlots(input)).rejects.toThrow(/cannot provide this service/i);
  });

  it('should throw error when service does not exist', async () => {
    // Create staff member
    const staffResult = await db.insert(staffTable)
      .values({
        email: 'staff@test.com',
        first_name: 'Staff',
        last_name: 'Member',
        role: 'staff'
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    const testDate = new Date('2024-01-01');

    const input: GetAvailableSlotsInput = {
      staff_id: staffId,
      service_id: 999, // Non-existent service
      date: testDate
    };

    expect(getAvailableSlots(input)).rejects.toThrow(/service not found/i);
  });
});
