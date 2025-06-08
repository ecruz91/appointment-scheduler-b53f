
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staffTable, servicesTable, staffServicesTable } from '../db/schema';
import { assignServiceToStaff } from '../handlers/assign_service_to_staff';
import { eq } from 'drizzle-orm';

describe('assignServiceToStaff', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should assign service to staff', async () => {
    // Create test staff
    const staff = await db.insert(staffTable)
      .values({
        email: 'staff@test.com',
        first_name: 'Test',
        last_name: 'Staff',
        phone: null,
        role: 'staff'
      })
      .returning()
      .execute();

    // Create test service
    const service = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        description: 'A test service',
        duration_minutes: 60,
        price: '50.00'
      })
      .returning()
      .execute();

    const result = await assignServiceToStaff(staff[0].id, service[0].id);

    // Verify assignment properties
    expect(result.staff_id).toEqual(staff[0].id);
    expect(result.service_id).toEqual(service[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save assignment to database', async () => {
    // Create test staff
    const staff = await db.insert(staffTable)
      .values({
        email: 'staff2@test.com',
        first_name: 'Test',
        last_name: 'Staff',
        phone: null,
        role: 'staff'
      })
      .returning()
      .execute();

    // Create test service  
    const service = await db.insert(servicesTable)
      .values({
        name: 'Test Service 2',
        description: 'Another test service',
        duration_minutes: 30,
        price: '25.00'
      })
      .returning()
      .execute();

    const result = await assignServiceToStaff(staff[0].id, service[0].id);

    // Query database to verify assignment was saved
    const assignments = await db.select()
      .from(staffServicesTable)
      .where(eq(staffServicesTable.id, result.id))
      .execute();

    expect(assignments).toHaveLength(1);
    expect(assignments[0].staff_id).toEqual(staff[0].id);
    expect(assignments[0].service_id).toEqual(service[0].id);
    expect(assignments[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when staff does not exist', async () => {
    // Create test service
    const service = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        description: 'A test service',
        duration_minutes: 60,
        price: '50.00'
      })
      .returning()
      .execute();

    await expect(assignServiceToStaff(999, service[0].id))
      .rejects.toThrow(/staff with id 999 not found/i);
  });

  it('should throw error when service does not exist', async () => {
    // Create test staff
    const staff = await db.insert(staffTable)
      .values({
        email: 'staff3@test.com',
        first_name: 'Test',
        last_name: 'Staff',
        phone: null,
        role: 'staff'
      })
      .returning()
      .execute();

    await expect(assignServiceToStaff(staff[0].id, 999))
      .rejects.toThrow(/service with id 999 not found/i);
  });
});
