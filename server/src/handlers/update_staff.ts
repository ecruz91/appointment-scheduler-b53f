
import { db } from '../db';
import { staffTable } from '../db/schema';
import { type UpdateStaffInput, type Staff } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStaff = async (input: UpdateStaffInput): Promise<Staff> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.first_name !== undefined) {
      updateData.first_name = input.first_name;
    }
    if (input.last_name !== undefined) {
      updateData.last_name = input.last_name;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.role !== undefined) {
      updateData.role = input.role;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update staff record
    const result = await db.update(staffTable)
      .set(updateData)
      .where(eq(staffTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Staff member with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Staff update failed:', error);
    throw error;
  }
};
