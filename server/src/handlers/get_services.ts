
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';

export const getServices = async (): Promise<Service[]> => {
  try {
    const result = await db.select()
      .from(servicesTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return result.map(service => ({
      ...service,
      price: parseFloat(service.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Get services failed:', error);
    throw error;
  }
};
