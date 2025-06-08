
import { db } from '../db';
import { staffTable } from '../db/schema';
import { type Staff } from '../schema';

export const getStaff = async (): Promise<Staff[]> => {
  try {
    const results = await db.select()
      .from(staffTable)
      .execute();

    return results.map(staff => ({
      ...staff,
      // No numeric conversions needed - all fields are already correct types
    }));
  } catch (error) {
    console.error('Get staff failed:', error);
    throw error;
  }
};
