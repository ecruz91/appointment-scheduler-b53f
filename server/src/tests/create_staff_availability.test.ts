
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staffTable, staffAvailabilityTable } from '../db/schema';
import { type CreateStaffAvailabilityInput } from '../schema';
import { createStaffAvailability } from '../handlers/create_staff_availability';
import { eq } from 'drizzle-orm';

// Test staff member
const testStaff = {
  email: 'john.doe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
  role: 'staff' as const
};

// Test availability input
const testInput: CreateStaffAvailabilityInput = {
  staff_id: 1, // Will be updated after staff creation
  day_of_week: 'monday',
  start_time: '09:00',
  end_time: '17:00'
};

describe('createStaffAvailability', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create staff availability', async () => {
    // Create staff member first
    const staffResult = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const staffId = staffResult[0].id;
    const input = { ...testInput, staff_id: staffId };

    const result = await createStaffAvailability(input);

    // Basic field validation - PostgreSQL time type returns HH:MM:SS format
    expect(result.staff_id).toEqual(staffId);
    expect(result.day_of_week).toEqual('monday');
    expect(result.start_time).toEqual('09:00:00');
    expect(result.end_time).toEqual('17:00:00');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save availability to database', async () => {
    // Create staff member first
    const staffResult = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const staffId = staffResult[0].id;
    const input = { ...testInput, staff_id: staffId };

    const result = await createStaffAvailability(input);

    // Query database to verify
    const availability = await db.select()
      .from(staffAvailabilityTable)
      .where(eq(staffAvailabilityTable.id, result.id))
      .execute();

    expect(availability).toHaveLength(1);
    expect(availability[0].staff_id).toEqual(staffId);
    expect(availability[0].day_of_week).toEqual('monday');
    expect(availability[0].start_time).toEqual('09:00:00');
    expect(availability[0].end_time).toEqual('17:00:00');
    expect(availability[0].is_active).toEqual(true);
    expect(availability[0].created_at).toBeInstanceOf(Date);
    expect(availability[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different days of week', async () => {
    // Create staff member first
    const staffResult = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Test different days
    const days = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    
    for (const day of days) {
      const input = { ...testInput, staff_id: staffId, day_of_week: day };
      const result = await createStaffAvailability(input);
      
      expect(result.day_of_week).toEqual(day);
      expect(result.staff_id).toEqual(staffId);
    }
  });

  it('should handle different time formats', async () => {
    // Create staff member first
    const staffResult = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Test with different time formats
    const timeTests = [
      { start_time: '08:30', end_time: '16:30', expected_start: '08:30:00', expected_end: '16:30:00' },
      { start_time: '10:00', end_time: '18:00', expected_start: '10:00:00', expected_end: '18:00:00' },
      { start_time: '07:15', end_time: '15:45', expected_start: '07:15:00', expected_end: '15:45:00' }
    ];

    for (const times of timeTests) {
      const input = { 
        ...testInput, 
        staff_id: staffId, 
        day_of_week: 'tuesday' as const,
        start_time: times.start_time,
        end_time: times.end_time
      };
      const result = await createStaffAvailability(input);
      
      expect(result.start_time).toEqual(times.expected_start);
      expect(result.end_time).toEqual(times.expected_end);
    }
  });

  it('should reject non-existent staff_id', async () => {
    const input = { ...testInput, staff_id: 999 };

    await expect(createStaffAvailability(input)).rejects.toThrow(/staff member.*not found/i);
  });

  it('should allow multiple availability slots for same staff', async () => {
    // Create staff member first
    const staffResult = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create multiple availability slots
    const slot1 = await createStaffAvailability({
      ...testInput,
      staff_id: staffId,
      day_of_week: 'monday'
    });

    const slot2 = await createStaffAvailability({
      ...testInput,
      staff_id: staffId,
      day_of_week: 'tuesday'
    });

    expect(slot1.id).not.toEqual(slot2.id);
    expect(slot1.staff_id).toEqual(staffId);
    expect(slot2.staff_id).toEqual(staffId);
    expect(slot1.day_of_week).toEqual('monday');
    expect(slot2.day_of_week).toEqual('tuesday');

    // Verify both exist in database
    const allSlots = await db.select()
      .from(staffAvailabilityTable)
      .where(eq(staffAvailabilityTable.staff_id, staffId))
      .execute();

    expect(allSlots).toHaveLength(2);
  });

  it('should set default values correctly', async () => {
    // Create staff member first
    const staffResult = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const staffId = staffResult[0].id;
    const input = { ...testInput, staff_id: staffId };

    const result = await createStaffAvailability(input);

    // Verify default values
    expect(result.is_active).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are recent (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    expect(result.created_at >= oneMinuteAgo).toBe(true);
    expect(result.updated_at >= oneMinuteAgo).toBe(true);
  });
});
