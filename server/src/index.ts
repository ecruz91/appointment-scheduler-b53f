
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCustomerInputSchema,
  createStaffInputSchema,
  updateStaffInputSchema,
  createServiceInputSchema,
  updateServiceInputSchema,
  createStaffAvailabilityInputSchema,
  getAvailableSlotsInputSchema,
  createAppointmentInputSchema,
  getAppointmentsInputSchema,
  updateAppointmentInputSchema
} from './schema';

// Import handlers
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { createStaff } from './handlers/create_staff';
import { getStaff } from './handlers/get_staff';
import { updateStaff } from './handlers/update_staff';
import { createService } from './handlers/create_service';
import { getServices } from './handlers/get_services';
import { updateService } from './handlers/update_service';
import { createStaffAvailability } from './handlers/create_staff_availability';
import { getStaffAvailability } from './handlers/get_staff_availability';
import { assignServiceToStaff } from './handlers/assign_service_to_staff';
import { getStaffServices } from './handlers/get_staff_services';
import { getAvailableSlots } from './handlers/get_available_slots';
import { createAppointment } from './handlers/create_appointment';
import { getAppointments } from './handlers/get_appointments';
import { updateAppointment } from './handlers/update_appointment';
import { cancelAppointment } from './handlers/cancel_appointment';
import { getAppointmentStats } from './handlers/get_appointment_stats';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Customer routes
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  getCustomers: publicProcedure
    .query(() => getCustomers()),

  // Staff routes
  createStaff: publicProcedure
    .input(createStaffInputSchema)
    .mutation(({ input }) => createStaff(input)),
  getStaff: publicProcedure
    .query(() => getStaff()),
  updateStaff: publicProcedure
    .input(updateStaffInputSchema)
    .mutation(({ input }) => updateStaff(input)),

  // Service routes
  createService: publicProcedure
    .input(createServiceInputSchema)
    .mutation(({ input }) => createService(input)),
  getServices: publicProcedure
    .query(() => getServices()),
  updateService: publicProcedure
    .input(updateServiceInputSchema)
    .mutation(({ input }) => updateService(input)),

  // Staff availability routes
  createStaffAvailability: publicProcedure
    .input(createStaffAvailabilityInputSchema)
    .mutation(({ input }) => createStaffAvailability(input)),
  getStaffAvailability: publicProcedure
    .input(z.object({ staffId: z.number() }))
    .query(({ input }) => getStaffAvailability(input.staffId)),

  // Staff services routes
  assignServiceToStaff: publicProcedure
    .input(z.object({ staffId: z.number(), serviceId: z.number() }))
    .mutation(({ input }) => assignServiceToStaff(input.staffId, input.serviceId)),
  getStaffServices: publicProcedure
    .input(z.object({ staffId: z.number() }))
    .query(({ input }) => getStaffServices(input.staffId)),

  // Appointment booking routes
  getAvailableSlots: publicProcedure
    .input(getAvailableSlotsInputSchema)
    .query(({ input }) => getAvailableSlots(input)),
  createAppointment: publicProcedure
    .input(createAppointmentInputSchema)
    .mutation(({ input }) => createAppointment(input)),
  getAppointments: publicProcedure
    .input(getAppointmentsInputSchema)
    .query(({ input }) => getAppointments(input)),
  updateAppointment: publicProcedure
    .input(updateAppointmentInputSchema)
    .mutation(({ input }) => updateAppointment(input)),
  cancelAppointment: publicProcedure
    .input(z.object({ appointmentId: z.number() }))
    .mutation(({ input }) => cancelAppointment(input.appointmentId)),

  // Reporting routes
  getAppointmentStats: publicProcedure
    .input(z.object({ 
      staffId: z.number().optional(), 
      dateFrom: z.coerce.date().optional(), 
      dateTo: z.coerce.date().optional() 
    }))
    .query(({ input }) => getAppointmentStats(input.staffId, input.dateFrom, input.dateTo)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
