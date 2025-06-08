
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { getCustomers } from '../handlers/get_customers';

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();
    expect(result).toEqual([]);
  });

  it('should return all customers', async () => {
    // Create test customers
    const customer1: CreateCustomerInput = {
      email: 'customer1@example.com',
      first_name: 'John',
      last_name: 'Doe',
      phone: '555-0001'
    };

    const customer2: CreateCustomerInput = {
      email: 'customer2@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: null
    };

    await db.insert(customersTable)
      .values([customer1, customer2])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    
    // Check first customer
    expect(result[0].email).toEqual('customer1@example.com');
    expect(result[0].first_name).toEqual('John');
    expect(result[0].last_name).toEqual('Doe');
    expect(result[0].phone).toEqual('555-0001');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check second customer
    expect(result[1].email).toEqual('customer2@example.com');
    expect(result[1].first_name).toEqual('Jane');
    expect(result[1].last_name).toEqual('Smith');
    expect(result[1].phone).toBeNull();
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return customers in insertion order', async () => {
    // Create customers in specific order
    const customers: CreateCustomerInput[] = [
      {
        email: 'first@example.com',
        first_name: 'First',
        last_name: 'Customer',
        phone: null
      },
      {
        email: 'second@example.com',
        first_name: 'Second',
        last_name: 'Customer',
        phone: null
      },
      {
        email: 'third@example.com',
        first_name: 'Third',
        last_name: 'Customer',
        phone: null
      }
    ];

    for (const customer of customers) {
      await db.insert(customersTable)
        .values(customer)
        .execute();
    }

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    expect(result[0].email).toEqual('first@example.com');
    expect(result[1].email).toEqual('second@example.com');
    expect(result[2].email).toEqual('third@example.com');
  });
});
