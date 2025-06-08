
import { z } from 'zod';

// Enums
export const appointmentStatusSchema = z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']);
export const staffRoleSchema = z.enum(['staff', 'admin']);
export const dayOfWeekSchema = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

// Staff schema
export const staffSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  role: staffRoleSchema,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Staff = z.infer<typeof staffSchema>;

// Service schema
export const serviceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  duration_minutes: z.number().int().positive(),
  price: z.number().positive(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Service = z.infer<typeof serviceSchema>;

// Staff availability schema
export const staffAvailabilitySchema = z.object({
  id: z.number(),
  staff_id: z.number(),
  day_of_week: dayOfWeekSchema,
  start_time: z.string(), // HH:MM format
  end_time: z.string(), // HH:MM format
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StaffAvailability = z.infer<typeof staffAvailabilitySchema>;

// Staff services (many-to-many relation)
export const staffServiceSchema = z.object({
  id: z.number(),
  staff_id: z.number(),
  service_id: z.number(),
  created_at: z.coerce.date()
});

export type StaffService = z.infer<typeof staffServiceSchema>;

// Appointment schema
export const appointmentSchema = z.object({
  id: z.number(),
  customer_id: z.number().nullable(),
  staff_id: z.number(),
  service_id: z.number(),
  guest_email: z.string().email().nullable(),
  guest_first_name: z.string().nullable(),
  guest_last_name: z.string().nullable(),
  guest_phone: z.string().nullable(),
  appointment_date: z.coerce.date(),
  start_time: z.string(), // HH:MM format
  end_time: z.string(), // HH:MM format
  status: appointmentStatusSchema,
  notes: z.string().nullable(),
  confirmation_sent: z.boolean(),
  reminder_24h_sent: z.boolean(),
  reminder_1h_sent: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Appointment = z.infer<typeof appointmentSchema>;

// Input schemas for creating records
export const createCustomerInputSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

export const createStaffInputSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().nullable(),
  role: staffRoleSchema
});

export type CreateStaffInput = z.infer<typeof createStaffInputSchema>;

export const createServiceInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  duration_minutes: z.number().int().positive(),
  price: z.number().positive()
});

export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;

export const createStaffAvailabilityInputSchema = z.object({
  staff_id: z.number(),
  day_of_week: dayOfWeekSchema,
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) // HH:MM format
});

export type CreateStaffAvailabilityInput = z.infer<typeof createStaffAvailabilityInputSchema>;

export const createAppointmentInputSchema = z.object({
  customer_id: z.number().nullable(),
  staff_id: z.number(),
  service_id: z.number(),
  guest_email: z.string().email().nullable(),
  guest_first_name: z.string().nullable(),
  guest_last_name: z.string().nullable(),
  guest_phone: z.string().nullable(),
  appointment_date: z.coerce.date(),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  notes: z.string().nullable()
}).refine(
  (data) => data.customer_id !== null || (data.guest_email !== null && data.guest_first_name !== null && data.guest_last_name !== null),
  {
    message: "Either customer_id must be provided or guest details (email, first_name, last_name) must be provided"
  }
);

export type CreateAppointmentInput = z.infer<typeof createAppointmentInputSchema>;

// Update schemas
export const updateAppointmentInputSchema = z.object({
  id: z.number(),
  appointment_date: z.coerce.date().optional(),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  status: appointmentStatusSchema.optional(),
  notes: z.string().nullable().optional()
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentInputSchema>;

export const updateServiceInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  duration_minutes: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  is_active: z.boolean().optional()
});

export type UpdateServiceInput = z.infer<typeof updateServiceInputSchema>;

export const updateStaffInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  role: staffRoleSchema.optional(),
  is_active: z.boolean().optional()
});

export type UpdateStaffInput = z.infer<typeof updateStaffInputSchema>;

// Query schemas
export const getAvailableSlotsInputSchema = z.object({
  staff_id: z.number(),
  service_id: z.number(),
  date: z.coerce.date()
});

export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsInputSchema>;

export const getAppointmentsInputSchema = z.object({
  staff_id: z.number().optional(),
  customer_id: z.number().optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  status: appointmentStatusSchema.optional()
});

export type GetAppointmentsInput = z.infer<typeof getAppointmentsInputSchema>;

// Response schemas
export const availableSlotSchema = z.object({
  start_time: z.string(),
  end_time: z.string()
});

export type AvailableSlot = z.infer<typeof availableSlotSchema>;

export const appointmentStatsSchema = z.object({
  total_appointments: z.number(),
  completed_appointments: z.number(),
  cancelled_appointments: z.number(),
  revenue: z.number()
});

export type AppointmentStats = z.infer<typeof appointmentStatsSchema>;
