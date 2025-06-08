
import { db } from '../db';
import { staffServicesTable, staffTable, servicesTable } from '../db/schema';
import { type StaffService } from '../schema';
import { eq } from 'drizzle-orm';

export const assignServiceToStaff = async (staffId: number, serviceId: number): Promise<StaffService> => {
  try {
    // Verify staff exists
    const staff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, staffId))
      .execute();

    if (staff.length === 0) {
      throw new Error(`Staff with id ${staffId} not found`);
    }

    // Verify service exists
    const service = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, serviceId))
      .execute();

    if (service.length === 0) {
      throw new Error(`Service with id ${serviceId} not found`);
    }

    // Insert staff service assignment
    const result = await db.insert(staffServicesTable)
      .values({
        staff_id: staffId,
        service_id: serviceId
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Staff service assignment failed:', error);
    throw error;
  }
};
