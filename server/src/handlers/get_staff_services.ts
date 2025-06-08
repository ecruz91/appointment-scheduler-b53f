
import { db } from '../db';
import { servicesTable, staffServicesTable } from '../db/schema';
import { type Service } from '../schema';
import { eq } from 'drizzle-orm';

export const getStaffServices = async (staffId: number): Promise<Service[]> => {
  try {
    // Join staff_services with services to get all services for the staff member
    const results = await db.select()
      .from(staffServicesTable)
      .innerJoin(servicesTable, eq(staffServicesTable.service_id, servicesTable.id))
      .where(eq(staffServicesTable.staff_id, staffId))
      .execute();

    // Transform the joined results and convert numeric fields
    return results.map(result => ({
      ...result.services,
      price: parseFloat(result.services.price) // Convert numeric field to number
    }));
  } catch (error) {
    console.error('Failed to get staff services:', error);
    throw error;
  }
};
