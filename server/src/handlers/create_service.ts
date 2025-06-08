
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput, type Service } from '../schema';

export const createService = async (input: CreateServiceInput): Promise<Service> => {
  try {
    // Insert service record
    const result = await db.insert(servicesTable)
      .values({
        name: input.name,
        description: input.description,
        duration_minutes: input.duration_minutes,
        price: input.price.toString(), // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const service = result[0];
    return {
      ...service,
      price: parseFloat(service.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Service creation failed:', error);
    throw error;
  }
};
