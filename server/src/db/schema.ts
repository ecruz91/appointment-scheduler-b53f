
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum, time, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const appointmentStatusEnum = pgEnum('appointment_status', ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']);
export const staffRoleEnum = pgEnum('staff_role', ['staff', 'admin']);
export const dayOfWeekEnum = pgEnum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);

// Tables
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone: text('phone'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const staffTable = pgTable('staff', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone: text('phone'),
  role: staffRoleEnum('role').notNull().default('staff'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  duration_minutes: integer('duration_minutes').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const staffAvailabilityTable = pgTable('staff_availability', {
  id: serial('id').primaryKey(),
  staff_id: integer('staff_id').notNull().references(() => staffTable.id),
  day_of_week: dayOfWeekEnum('day_of_week').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const staffServicesTable = pgTable('staff_services', {
  id: serial('id').primaryKey(),
  staff_id: integer('staff_id').notNull().references(() => staffTable.id),
  service_id: integer('service_id').notNull().references(() => servicesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const appointmentsTable = pgTable('appointments', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').references(() => customersTable.id),
  staff_id: integer('staff_id').notNull().references(() => staffTable.id),
  service_id: integer('service_id').notNull().references(() => servicesTable.id),
  guest_email: text('guest_email'),
  guest_first_name: text('guest_first_name'),
  guest_last_name: text('guest_last_name'),
  guest_phone: text('guest_phone'),
  appointment_date: date('appointment_date').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  status: appointmentStatusEnum('status').notNull().default('scheduled'),
  notes: text('notes'),
  confirmation_sent: boolean('confirmation_sent').notNull().default(false),
  reminder_24h_sent: boolean('reminder_24h_sent').notNull().default(false),
  reminder_1h_sent: boolean('reminder_1h_sent').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customersTable, ({ many }) => ({
  appointments: many(appointmentsTable),
}));

export const staffRelations = relations(staffTable, ({ many }) => ({
  appointments: many(appointmentsTable),
  availability: many(staffAvailabilityTable),
  services: many(staffServicesTable),
}));

export const servicesRelations = relations(servicesTable, ({ many }) => ({
  appointments: many(appointmentsTable),
  staff: many(staffServicesTable),
}));

export const staffAvailabilityRelations = relations(staffAvailabilityTable, ({ one }) => ({
  staff: one(staffTable, {
    fields: [staffAvailabilityTable.staff_id],
    references: [staffTable.id],
  }),
}));

export const staffServicesRelations = relations(staffServicesTable, ({ one }) => ({
  staff: one(staffTable, {
    fields: [staffServicesTable.staff_id],
    references: [staffTable.id],
  }),
  service: one(servicesTable, {
    fields: [staffServicesTable.service_id],
    references: [servicesTable.id],
  }),
}));

export const appointmentsRelations = relations(appointmentsTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [appointmentsTable.customer_id],
    references: [customersTable.id],
  }),
  staff: one(staffTable, {
    fields: [appointmentsTable.staff_id],
    references: [staffTable.id],
  }),
  service: one(servicesTable, {
    fields: [appointmentsTable.service_id],
    references: [servicesTable.id],
  }),
}));

// Export all tables
export const tables = {
  customers: customersTable,
  staff: staffTable,
  services: servicesTable,
  staffAvailability: staffAvailabilityTable,
  staffServices: staffServicesTable,
  appointments: appointmentsTable,
};
