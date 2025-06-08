
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type Customer } from '../schema';

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  try {
    // Insert customer record
    const result = await db.insert(customersTable)
      .values({
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone
      })
      .returning()
      .execute();

    const customer = result[0];
    return customer;
  } catch (error) {
    console.error('Customer creation failed:', error);
    throw error;
  }
};
