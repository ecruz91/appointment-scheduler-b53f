
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateCustomerInput = {
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890'
};

// Test input without optional phone field
const testInputNoPhone: CreateCustomerInput = {
  email: 'nophone@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  phone: null
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all fields', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.phone).toEqual('+1234567890');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a customer without phone', async () => {
    const result = await createCustomer(testInputNoPhone);

    expect(result.email).toEqual('nophone@example.com');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.phone).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query using proper drizzle syntax
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].email).toEqual('test@example.com');
    expect(customers[0].first_name).toEqual('John');
    expect(customers[0].last_name).toEqual('Doe');
    expect(customers[0].phone).toEqual('+1234567890');
    expect(customers[0].created_at).toBeInstanceOf(Date);
    expect(customers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for duplicate email', async () => {
    // Create first customer
    await createCustomer(testInput);

    // Try to create another customer with same email
    const duplicateInput: CreateCustomerInput = {
      email: 'test@example.com',
      first_name: 'Different',
      last_name: 'Person',
      phone: null
    };

    await expect(createCustomer(duplicateInput))
      .rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});
