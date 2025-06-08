
import { db } from '../db';
import { staffTable } from '../db/schema';
import { type CreateStaffInput, type Staff } from '../schema';

export const createStaff = async (input: CreateStaffInput): Promise<Staff> => {
  try {
    // Insert staff record
    const result = await db.insert(staffTable)
      .values({
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone,
        role: input.role
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Staff creation failed:', error);
    throw error;
  }
};
