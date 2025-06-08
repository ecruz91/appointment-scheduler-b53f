
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staffTable, staffAvailabilityTable } from '../db/schema';
import { type CreateStaffInput, type CreateStaffAvailabilityInput } from '../schema';
import { getStaffAvailability } from '../handlers/get_staff_availability';
import { eq } from 'drizzle-orm';

describe('getStaffAvailability', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return availability for existing staff', async () => {
    // Create test staff
    const staffInput: CreateStaffInput = {
      email: 'staff@test.com',
      first_name: 'John',
      last_name: 'Doe',
      phone: '555-1234',
      role: 'staff'
    };

    const staffResult = await db.insert(staffTable)
      .values(staffInput)
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create test availability records
    const availabilityInputs: CreateStaffAvailabilityInput[] = [
      {
        staff_id: staffId,
        day_of_week: 'monday',
        start_time: '09:00',
        end_time: '17:00'
      },
      {
        staff_id: staffId,
        day_of_week: 'tuesday',
        start_time: '10:00',
        end_time: '18:00'
      }
    ];

    for (const input of availabilityInputs) {
      await db.insert(staffAvailabilityTable)
        .values(input)
        .execute();
    }

    // Test the handler
    const results = await getStaffAvailability(staffId);

    expect(results).toHaveLength(2);
    
    // Verify first availability record
    const mondayAvailability = results.find(a => a.day_of_week === 'monday');
    expect(mondayAvailability).toBeDefined();
    expect(mondayAvailability!.staff_id).toEqual(staffId);
    expect(mondayAvailability!.start_time).toEqual('09:00:00');
    expect(mondayAvailability!.end_time).toEqual('17:00:00');
    expect(mondayAvailability!.is_active).toBe(true);
    expect(mondayAvailability!.created_at).toBeInstanceOf(Date);
    expect(mondayAvailability!.updated_at).toBeInstanceOf(Date);

    // Verify second availability record
    const tuesdayAvailability = results.find(a => a.day_of_week === 'tuesday');
    expect(tuesdayAvailability).toBeDefined();
    expect(tuesdayAvailability!.staff_id).toEqual(staffId);
    expect(tuesdayAvailability!.start_time).toEqual('10:00:00');
    expect(tuesdayAvailability!.end_time).toEqual('18:00:00');
    expect(tuesdayAvailability!.is_active).toBe(true);
  });

  it('should return empty array for staff with no availability', async () => {
    // Create test staff without availability
    const staffInput: CreateStaffInput = {
      email: 'noavailability@test.com',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: null,
      role: 'admin'
    };

    const staffResult = await db.insert(staffTable)
      .values(staffInput)
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Test the handler
    const results = await getStaffAvailability(staffId);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return empty array for non-existent staff', async () => {
    const nonExistentStaffId = 99999;
    
    const results = await getStaffAvailability(nonExistentStaffId);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should include inactive availability records', async () => {
    // Create test staff
    const staffInput: CreateStaffInput = {
      email: 'inactive@test.com',
      first_name: 'Bob',
      last_name: 'Wilson',
      phone: '555-9876',
      role: 'staff'
    };

    const staffResult = await db.insert(staffTable)
      .values(staffInput)
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Create availability record and then deactivate it
    const availabilityResult = await db.insert(staffAvailabilityTable)
      .values({
        staff_id: staffId,
        day_of_week: 'wednesday',
        start_time: '08:00',
        end_time: '16:00'
      })
      .returning()
      .execute();

    // Update to inactive
    await db.update(staffAvailabilityTable)
      .set({ is_active: false })
      .where(eq(staffAvailabilityTable.id, availabilityResult[0].id))
      .execute();

    // Test the handler - should still return inactive records
    const results = await getStaffAvailability(staffId);

    expect(results).toHaveLength(1);
    expect(results[0].is_active).toBe(false);
    expect(results[0].day_of_week).toEqual('wednesday');
  });
});
