
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staffTable, servicesTable, staffServicesTable } from '../db/schema';
import { type CreateStaffInput, type CreateServiceInput } from '../schema';
import { getStaffServices } from '../handlers/get_staff_services';

// Test data
const testStaff: CreateStaffInput = {
  email: 'staff@test.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-0123',
  role: 'staff'
};

const testService1: CreateServiceInput = {
  name: 'Haircut',
  description: 'Professional haircut service',
  duration_minutes: 30,
  price: 25.00
};

const testService2: CreateServiceInput = {
  name: 'Hair Wash',
  description: 'Hair washing service',
  duration_minutes: 15,
  price: 10.00
};

const testService3: CreateServiceInput = {
  name: 'Hair Styling',
  description: 'Professional hair styling',
  duration_minutes: 45,
  price: 40.00
};

describe('getStaffServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return services for a staff member', async () => {
    // Create staff member
    const staffResult = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();
    const staffId = staffResult[0].id;

    // Create services
    const service1Result = await db.insert(servicesTable)
      .values({
        ...testService1,
        price: testService1.price.toString()
      })
      .returning()
      .execute();

    const service2Result = await db.insert(servicesTable)
      .values({
        ...testService2,
        price: testService2.price.toString()
      })
      .returning()
      .execute();

    // Link services to staff
    await db.insert(staffServicesTable)
      .values([
        { staff_id: staffId, service_id: service1Result[0].id },
        { staff_id: staffId, service_id: service2Result[0].id }
      ])
      .execute();

    const result = await getStaffServices(staffId);

    expect(result).toHaveLength(2);
    
    // Check first service
    const haircut = result.find(s => s.name === 'Haircut');
    expect(haircut).toBeDefined();
    expect(haircut!.description).toEqual('Professional haircut service');
    expect(haircut!.duration_minutes).toEqual(30);
    expect(haircut!.price).toEqual(25.00);
    expect(typeof haircut!.price).toBe('number');
    expect(haircut!.is_active).toBe(true);

    // Check second service
    const hairWash = result.find(s => s.name === 'Hair Wash');
    expect(hairWash).toBeDefined();
    expect(hairWash!.description).toEqual('Hair washing service');
    expect(hairWash!.duration_minutes).toEqual(15);
    expect(hairWash!.price).toEqual(10.00);
    expect(typeof hairWash!.price).toBe('number');
  });

  it('should return empty array for staff with no services', async () => {
    // Create staff member
    const staffResult = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();
    const staffId = staffResult[0].id;

    const result = await getStaffServices(staffId);

    expect(result).toEqual([]);
  });

  it('should only return services linked to specific staff member', async () => {
    // Create two staff members
    const staff1Result = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();

    const staff2Result = await db.insert(staffTable)
      .values({
        ...testStaff,
        email: 'staff2@test.com'
      })
      .returning()
      .execute();

    // Create services
    const service1Result = await db.insert(servicesTable)
      .values({
        ...testService1,
        price: testService1.price.toString()
      })
      .returning()
      .execute();

    const service2Result = await db.insert(servicesTable)
      .values({
        ...testService2,
        price: testService2.price.toString()
      })
      .returning()
      .execute();

    const service3Result = await db.insert(servicesTable)
      .values({
        ...testService3,
        price: testService3.price.toString()
      })
      .returning()
      .execute();

    // Link different services to each staff member
    await db.insert(staffServicesTable)
      .values([
        { staff_id: staff1Result[0].id, service_id: service1Result[0].id },
        { staff_id: staff1Result[0].id, service_id: service2Result[0].id },
        { staff_id: staff2Result[0].id, service_id: service3Result[0].id }
      ])
      .execute();

    // Get services for first staff member
    const staff1Services = await getStaffServices(staff1Result[0].id);
    expect(staff1Services).toHaveLength(2);
    expect(staff1Services.find(s => s.name === 'Haircut')).toBeDefined();
    expect(staff1Services.find(s => s.name === 'Hair Wash')).toBeDefined();
    expect(staff1Services.find(s => s.name === 'Hair Styling')).toBeUndefined();

    // Get services for second staff member
    const staff2Services = await getStaffServices(staff2Result[0].id);
    expect(staff2Services).toHaveLength(1);
    expect(staff2Services.find(s => s.name === 'Hair Styling')).toBeDefined();
    expect(staff2Services.find(s => s.name === 'Haircut')).toBeUndefined();
    expect(staff2Services.find(s => s.name === 'Hair Wash')).toBeUndefined();
  });

  it('should include all service fields', async () => {
    // Create staff member
    const staffResult = await db.insert(staffTable)
      .values(testStaff)
      .returning()
      .execute();
    const staffId = staffResult[0].id;

    // Create service
    const serviceResult = await db.insert(servicesTable)
      .values({
        ...testService1,
        price: testService1.price.toString()
      })
      .returning()
      .execute();

    // Link service to staff
    await db.insert(staffServicesTable)
      .values({ staff_id: staffId, service_id: serviceResult[0].id })
      .execute();

    const result = await getStaffServices(staffId);

    expect(result).toHaveLength(1);
    const service = result[0];

    // Verify all required fields are present
    expect(service.id).toBeDefined();
    expect(service.name).toEqual('Haircut');
    expect(service.description).toEqual('Professional haircut service');
    expect(service.duration_minutes).toEqual(30);
    expect(service.price).toEqual(25.00);
    expect(service.is_active).toBe(true);
    expect(service.created_at).toBeInstanceOf(Date);
    expect(service.updated_at).toBeInstanceOf(Date);
  });
});
