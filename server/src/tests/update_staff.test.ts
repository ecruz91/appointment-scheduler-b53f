
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staffTable } from '../db/schema';
import { type UpdateStaffInput, type CreateStaffInput } from '../schema';
import { updateStaff } from '../handlers/update_staff';
import { eq } from 'drizzle-orm';

// Test input for creating initial staff
const createStaffInput: CreateStaffInput = {
  email: 'john.doe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-0123',
  role: 'staff'
};

describe('updateStaff', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update staff member fields', async () => {
    // Create initial staff member
    const createResult = await db.insert(staffTable)
      .values({
        ...createStaffInput,
        is_active: true
      })
      .returning()
      .execute();

    const staffId = createResult[0].id;

    // Update staff member
    const updateInput: UpdateStaffInput = {
      id: staffId,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      role: 'admin',
      is_active: false
    };

    const result = await updateStaff(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(staffId);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.role).toEqual('admin');
    expect(result.is_active).toEqual(false);
    expect(result.phone).toEqual('555-0123'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create initial staff member
    const createResult = await db.insert(staffTable)
      .values({
        ...createStaffInput,
        is_active: true
      })
      .returning()
      .execute();

    const staffId = createResult[0].id;

    // Update only first name
    const updateInput: UpdateStaffInput = {
      id: staffId,
      first_name: 'Updated Name'
    };

    const result = await updateStaff(updateInput);

    // Verify only first_name was updated
    expect(result.first_name).toEqual('Updated Name');
    expect(result.last_name).toEqual('Doe'); // Should remain unchanged
    expect(result.email).toEqual('john.doe@example.com'); // Should remain unchanged
    expect(result.role).toEqual('staff'); // Should remain unchanged
    expect(result.is_active).toEqual(true); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update staff in database', async () => {
    // Create initial staff member
    const createResult = await db.insert(staffTable)
      .values({
        ...createStaffInput,
        is_active: true
      })
      .returning()
      .execute();

    const staffId = createResult[0].id;

    // Update staff member
    const updateInput: UpdateStaffInput = {
      id: staffId,
      first_name: 'Updated',
      role: 'admin'
    };

    await updateStaff(updateInput);

    // Verify changes were persisted to database
    const staffMembers = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, staffId))
      .execute();

    expect(staffMembers).toHaveLength(1);
    expect(staffMembers[0].first_name).toEqual('Updated');
    expect(staffMembers[0].role).toEqual('admin');
    expect(staffMembers[0].last_name).toEqual('Doe'); // Unchanged
    expect(staffMembers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable phone field updates', async () => {
    // Create initial staff member with phone
    const createResult = await db.insert(staffTable)
      .values({
        ...createStaffInput,
        phone: '555-0123',
        is_active: true
      })
      .returning()
      .execute();

    const staffId = createResult[0].id;

    // Update phone to null
    const updateInput: UpdateStaffInput = {
      id: staffId,
      phone: null
    };

    const result = await updateStaff(updateInput);

    expect(result.phone).toBeNull();
    expect(result.first_name).toEqual('John'); // Should remain unchanged
  });

  it('should throw error for non-existent staff id', async () => {
    const updateInput: UpdateStaffInput = {
      id: 99999,
      first_name: 'Test'
    };

    expect(updateStaff(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    // Create initial staff member
    const createResult = await db.insert(staffTable)
      .values({
        ...createStaffInput,
        is_active: true
      })
      .returning()
      .execute();

    const staffId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update staff member
    const updateInput: UpdateStaffInput = {
      id: staffId,
      first_name: 'Updated'
    };

    const result = await updateStaff(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
