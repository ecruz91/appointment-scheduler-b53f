
import { db } from '../db';
import { appointmentsTable, servicesTable } from '../db/schema';
import { type AppointmentStats } from '../schema';
import { eq, and, gte, lte, count, sum, SQL } from 'drizzle-orm';

export const getAppointmentStats = async (
  staffId?: number,
  dateFrom?: Date,
  dateTo?: Date
): Promise<AppointmentStats> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (staffId !== undefined) {
      conditions.push(eq(appointmentsTable.staff_id, staffId));
    }

    if (dateFrom !== undefined) {
      // Convert Date to YYYY-MM-DD string format for date column
      const dateFromStr = dateFrom.toISOString().split('T')[0];
      conditions.push(gte(appointmentsTable.appointment_date, dateFromStr));
    }

    if (dateTo !== undefined) {
      // Convert Date to YYYY-MM-DD string format for date column
      const dateToStr = dateTo.toISOString().split('T')[0];
      conditions.push(lte(appointmentsTable.appointment_date, dateToStr));
    }

    // Get total appointments count
    const totalQuery = conditions.length > 0
      ? db.select({ count: count(appointmentsTable.id) })
          .from(appointmentsTable)
          .where(and(...conditions))
      : db.select({ count: count(appointmentsTable.id) })
          .from(appointmentsTable);

    const totalResult = await totalQuery.execute();
    const totalCount = totalResult[0].count;

    // Get completed appointments count
    const completedConditions = [...conditions];
    completedConditions.push(eq(appointmentsTable.status, 'completed'));

    const completedQuery = db.select({ count: count(appointmentsTable.id) })
      .from(appointmentsTable)
      .where(and(...completedConditions));

    const completedResult = await completedQuery.execute();
    const completedCount = completedResult[0].count;

    // Get cancelled appointments count
    const cancelledConditions = [...conditions];
    cancelledConditions.push(eq(appointmentsTable.status, 'cancelled'));

    const cancelledQuery = db.select({ count: count(appointmentsTable.id) })
      .from(appointmentsTable)
      .where(and(...cancelledConditions));

    const cancelledResult = await cancelledQuery.execute();
    const cancelledCount = cancelledResult[0].count;

    // Calculate revenue for completed appointments only
    const revenueConditions = [...conditions];
    revenueConditions.push(eq(appointmentsTable.status, 'completed'));

    const revenueQuery = db.select({ revenue: sum(servicesTable.price) })
      .from(appointmentsTable)
      .innerJoin(servicesTable, eq(appointmentsTable.service_id, servicesTable.id))
      .where(and(...revenueConditions));

    const revenueResult = await revenueQuery.execute();
    const revenue = revenueResult[0].revenue;

    return {
      total_appointments: totalCount,
      completed_appointments: completedCount,
      cancelled_appointments: cancelledCount,
      revenue: revenue ? parseFloat(revenue) : 0
    };
  } catch (error) {
    console.error('Get appointment stats failed:', error);
    throw error;
  }
};
