
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { getServices } from '../handlers/get_services';

describe('getServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no services exist', async () => {
    const result = await getServices();
    expect(result).toEqual([]);
  });

  it('should return all services', async () => {
    // Create test services
    await db.insert(servicesTable)
      .values([
        {
          name: 'Haircut',
          description: 'Basic haircut service',
          duration_minutes: 30,
          price: '25.00'
        },
        {
          name: 'Massage',
          description: 'Relaxing massage',
          duration_minutes: 60,
          price: '80.00'
        },
        {
          name: 'Manicure',
          description: null,
          duration_minutes: 45,
          price: '35.50'
        }
      ])
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(3);
    
    // Check first service
    const haircut = result.find(s => s.name === 'Haircut');
    expect(haircut).toBeDefined();
    expect(haircut!.description).toEqual('Basic haircut service');
    expect(haircut!.duration_minutes).toEqual(30);
    expect(haircut!.price).toEqual(25.00);
    expect(typeof haircut!.price).toBe('number');
    expect(haircut!.is_active).toBe(true);
    expect(haircut!.id).toBeDefined();
    expect(haircut!.created_at).toBeInstanceOf(Date);
    expect(haircut!.updated_at).toBeInstanceOf(Date);

    // Check service with null description
    const manicure = result.find(s => s.name === 'Manicure');
    expect(manicure).toBeDefined();
    expect(manicure!.description).toBeNull();
    expect(manicure!.price).toEqual(35.50);
    expect(typeof manicure!.price).toBe('number');
  });

  it('should include both active and inactive services', async () => {
    // Create services with different active states
    await db.insert(servicesTable)
      .values([
        {
          name: 'Active Service',
          description: 'This is active',
          duration_minutes: 30,
          price: '25.00',
          is_active: true
        },
        {
          name: 'Inactive Service',
          description: 'This is inactive',
          duration_minutes: 45,
          price: '40.00',
          is_active: false
        }
      ])
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(2);
    
    const activeService = result.find(s => s.name === 'Active Service');
    const inactiveService = result.find(s => s.name === 'Inactive Service');
    
    expect(activeService!.is_active).toBe(true);
    expect(inactiveService!.is_active).toBe(false);
  });

  it('should handle decimal prices correctly', async () => {
    await db.insert(servicesTable)
      .values({
        name: 'Precision Service',
        description: 'Service with precise pricing',
        duration_minutes: 15,
        price: '99.99'
      })
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(1);
    expect(result[0].price).toEqual(99.99);
    expect(typeof result[0].price).toBe('number');
  });
});
