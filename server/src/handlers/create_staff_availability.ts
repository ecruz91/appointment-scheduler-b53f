
import { db } from '../db';
import { staffAvailabilityTable, staffTable } from '../db/schema';
import { type CreateStaffAvailabilityInput, type StaffAvailability } from '../schema';
import { eq } from 'drizzle-orm';

export const createStaffAvailability = async (input: CreateStaffAvailabilityInput): Promise<StaffAvailability> => {
  try {
    // Verify staff member exists
    const staff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, input.staff_id))
      .execute();

    if (staff.length === 0) {
      throw new Error(`Staff member with ID ${input.staff_id} not found`);
    }

    // Insert staff availability record
    const result = await db.insert(staffAvailabilityTable)
      .values({
        staff_id: input.staff_id,
        day_of_week: input.day_of_week,
        start_time: input.start_time,
        end_time: input.end_time
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Staff availability creation failed:', error);
    throw error;
  }
};
