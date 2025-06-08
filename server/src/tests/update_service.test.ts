
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type UpdateServiceInput } from '../schema';
import { updateService } from '../handlers/update_service';
import { eq } from 'drizzle-orm';

describe('updateService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test service directly in the database
  const createTestService = async () => {
    const result = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        description: 'A service for testing',
        duration_minutes: 60,
        price: '99.99'
      })
      .returning()
      .execute();

    return {
      ...result[0],
      price: parseFloat(result[0].price)
    };
  };

  it('should update service name', async () => {
    // Create initial service
    const createdService = await createTestService();

    const updateInput: UpdateServiceInput = {
      id: createdService.id,
      name: 'Updated Service Name'
    };

    const result = await updateService(updateInput);

    expect(result.id).toEqual(createdService.id);
    expect(result.name).toEqual('Updated Service Name');
    expect(result.description).toEqual('A service for testing');
    expect(result.duration_minutes).toEqual(60);
    expect(result.price).toEqual(99.99);
    expect(result.is_active).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdService.updated_at).toBe(true);
  });

  it('should update service price', async () => {
    // Create initial service
    const createdService = await createTestService();

    const updateInput: UpdateServiceInput = {
      id: createdService.id,
      price: 149.50
    };

    const result = await updateService(updateInput);

    expect(result.id).toEqual(createdService.id);
    expect(result.price).toEqual(149.50);
    expect(typeof result.price).toBe('number');
    expect(result.name).toEqual('Test Service');
    expect(result.duration_minutes).toEqual(60);
  });

  it('should update multiple fields', async () => {
    // Create initial service
    const createdService = await createTestService();

    const updateInput: UpdateServiceInput = {
      id: createdService.id,
      name: 'Premium Service',
      description: 'Updated premium service description',
      duration_minutes: 90,
      price: 199.99,
      is_active: false
    };

    const result = await updateService(updateInput);

    expect(result.id).toEqual(createdService.id);
    expect(result.name).toEqual('Premium Service');
    expect(result.description).toEqual('Updated premium service description');
    expect(result.duration_minutes).toEqual(90);
    expect(result.price).toEqual(199.99);
    expect(result.is_active).toBe(false);
  });

  it('should update service in database', async () => {
    // Create initial service
    const createdService = await createTestService();

    const updateInput: UpdateServiceInput = {
      id: createdService.id,
      name: 'Database Updated Service',
      price: 75.25
    };

    await updateService(updateInput);

    // Verify changes in database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, createdService.id))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].name).toEqual('Database Updated Service');
    expect(parseFloat(services[0].price)).toEqual(75.25);
    expect(services[0].description).toEqual('A service for testing');
    expect(services[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description update', async () => {
    // Create initial service
    const createdService = await createTestService();

    const updateInput: UpdateServiceInput = {
      id: createdService.id,
      description: null
    };

    const result = await updateService(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Test Service');
    expect(result.price).toEqual(99.99);
  });

  it('should throw error for non-existent service', async () => {
    const updateInput: UpdateServiceInput = {
      id: 99999,
      name: 'Non-existent Service'
    };

    await expect(updateService(updateInput)).rejects.toThrow(/not found/i);
  });
});
