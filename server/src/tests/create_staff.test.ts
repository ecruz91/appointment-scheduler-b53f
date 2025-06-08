
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staffTable } from '../db/schema';
import { type CreateStaffInput } from '../schema';
import { createStaff } from '../handlers/create_staff';
import { eq } from 'drizzle-orm';

// Test inputs
const testStaffInput: CreateStaffInput = {
  email: 'john.doe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
  role: 'staff'
};

const testAdminInput: CreateStaffInput = {
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'User',
  phone: null,
  role: 'admin'
};

describe('createStaff', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a staff member', async () => {
    const result = await createStaff(testStaffInput);

    // Basic field validation
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.phone).toEqual('+1234567890');
    expect(result.role).toEqual('staff');
    expect(result.is_active).toBe(true); // Should default to true
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an admin staff member', async () => {
    const result = await createStaff(testAdminInput);

    expect(result.email).toEqual('admin@example.com');
    expect(result.first_name).toEqual('Admin');
    expect(result.last_name).toEqual('User');
    expect(result.phone).toBeNull();
    expect(result.role).toEqual('admin');
    expect(result.is_active).toBe(true);
  });

  it('should save staff to database', async () => {
    const result = await createStaff(testStaffInput);

    // Query using proper drizzle syntax
    const staff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, result.id))
      .execute();

    expect(staff).toHaveLength(1);
    expect(staff[0].email).toEqual('john.doe@example.com');
    expect(staff[0].first_name).toEqual('John');
    expect(staff[0].last_name).toEqual('Doe');
    expect(staff[0].phone).toEqual('+1234567890');
    expect(staff[0].role).toEqual('staff');
    expect(staff[0].is_active).toBe(true);
    expect(staff[0].created_at).toBeInstanceOf(Date);
    expect(staff[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null phone number', async () => {
    const inputWithNullPhone: CreateStaffInput = {
      ...testStaffInput,
      phone: null
    };

    const result = await createStaff(inputWithNullPhone);

    expect(result.phone).toBeNull();

    // Verify in database
    const staff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, result.id))
      .execute();

    expect(staff[0].phone).toBeNull();
  });

  it('should fail with duplicate email', async () => {
    // Create first staff member
    await createStaff(testStaffInput);

    // Try to create another with same email
    const duplicateInput: CreateStaffInput = {
      ...testStaffInput,
      first_name: 'Jane',
      last_name: 'Smith'
    };

    await expect(createStaff(duplicateInput)).rejects.toThrow(/unique/i);
  });
});
