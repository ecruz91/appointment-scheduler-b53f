
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { createService } from '../handlers/create_service';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateServiceInput = {
  name: 'Haircut',
  description: 'Basic haircut service',
  duration_minutes: 30,
  price: 25.50
};

describe('createService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service', async () => {
    const result = await createService(testInput);

    // Basic field validation
    expect(result.name).toEqual('Haircut');
    expect(result.description).toEqual('Basic haircut service');
    expect(result.duration_minutes).toEqual(30);
    expect(result.price).toEqual(25.50);
    expect(typeof result.price).toBe('number');
    expect(result.is_active).toBe(true); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save service to database', async () => {
    const result = await createService(testInput);

    // Query using proper drizzle syntax
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].name).toEqual('Haircut');
    expect(services[0].description).toEqual('Basic haircut service');
    expect(services[0].duration_minutes).toEqual(30);
    expect(parseFloat(services[0].price)).toEqual(25.50);
    expect(services[0].is_active).toBe(true);
    expect(services[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    const inputWithNullDescription = {
      ...testInput,
      description: null
    };

    const result = await createService(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Haircut');
    expect(result.duration_minutes).toEqual(30);
    expect(result.price).toEqual(25.50);
  });

  it('should create service with different price formats', async () => {
    const inputWithIntegerPrice = {
      ...testInput,
      price: 30
    };

    const result = await createService(inputWithIntegerPrice);

    expect(result.price).toEqual(30);
    expect(typeof result.price).toBe('number');

    // Verify in database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(parseFloat(services[0].price)).toEqual(30);
  });
});
