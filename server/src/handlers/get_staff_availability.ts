
import { db } from '../db';
import { staffAvailabilityTable } from '../db/schema';
import { type StaffAvailability } from '../schema';
import { eq } from 'drizzle-orm';

export const getStaffAvailability = async (staffId: number): Promise<StaffAvailability[]> => {
  try {
    const results = await db.select()
      .from(staffAvailabilityTable)
      .where(eq(staffAvailabilityTable.staff_id, staffId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get staff availability:', error);
    throw error;
  }
};
