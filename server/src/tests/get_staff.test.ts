
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staffTable } from '../db/schema';
import { type CreateStaffInput } from '../schema';
import { getStaff } from '../handlers/get_staff';

// Test staff data
const testStaff1: CreateStaffInput = {
  email: 'john.doe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-0123',
  role: 'staff'
};

const testStaff2: CreateStaffInput = {
  email: 'jane.smith@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  phone: null,
  role: 'admin'
};

describe('getStaff', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no staff exist', async () => {
    const result = await getStaff();
    expect(result).toEqual([]);
  });

  it('should return all staff members', async () => {
    // Create test staff
    await db.insert(staffTable)
      .values([testStaff1, testStaff2])
      .execute();

    const result = await getStaff();

    expect(result).toHaveLength(2);
    
    // Check first staff member
    const staff1 = result.find(s => s.email === 'john.doe@example.com');
    expect(staff1).toBeDefined();
    expect(staff1!.first_name).toEqual('John');
    expect(staff1!.last_name).toEqual('Doe');
    expect(staff1!.phone).toEqual('555-0123');
    expect(staff1!.role).toEqual('staff');
    expect(staff1!.is_active).toBe(true);
    expect(staff1!.id).toBeDefined();
    expect(staff1!.created_at).toBeInstanceOf(Date);
    expect(staff1!.updated_at).toBeInstanceOf(Date);

    // Check second staff member
    const staff2 = result.find(s => s.email === 'jane.smith@example.com');
    expect(staff2).toBeDefined();
    expect(staff2!.first_name).toEqual('Jane');
    expect(staff2!.last_name).toEqual('Smith');
    expect(staff2!.phone).toBeNull();
    expect(staff2!.role).toEqual('admin');
    expect(staff2!.is_active).toBe(true);
  });

  it('should include inactive staff members', async () => {
    // Create active and inactive staff
    await db.insert(staffTable)
      .values([
        { ...testStaff1, is_active: true },
        { ...testStaff2, is_active: false }
      ])
      .execute();

    const result = await getStaff();

    expect(result).toHaveLength(2);
    
    const activeStaff = result.find(s => s.email === 'john.doe@example.com');
    const inactiveStaff = result.find(s => s.email === 'jane.smith@example.com');
    
    expect(activeStaff!.is_active).toBe(true);
    expect(inactiveStaff!.is_active).toBe(false);
  });

  it('should return staff with correct field types', async () => {
    await db.insert(staffTable)
      .values(testStaff1)
      .execute();

    const result = await getStaff();

    expect(result).toHaveLength(1);
    const staff = result[0];

    expect(typeof staff.id).toBe('number');
    expect(typeof staff.email).toBe('string');
    expect(typeof staff.first_name).toBe('string');
    expect(typeof staff.last_name).toBe('string');
    expect(typeof staff.role).toBe('string');
    expect(typeof staff.is_active).toBe('boolean');
    expect(staff.created_at).toBeInstanceOf(Date);
    expect(staff.updated_at).toBeInstanceOf(Date);
  });
});
