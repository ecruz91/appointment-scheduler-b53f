
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, X, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { trpc } from '@/utils/trpc';
import type { Appointment, Service, Staff } from '../../../server/src/schema';

interface AppointmentListProps {
  appointments: Appointment[];
  services: Service[];
  staff: Staff[];
  onAppointmentUpdate: () => void;
}

export function AppointmentList({ appointments, services, staff, onAppointmentUpdate }: AppointmentListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment: Appointment) => {
      const statusMatch = statusFilter === 'all' || appointment.status === statusFilter;
      const emailMatch = !searchEmail || 
        (appointment.guest_email && appointment.guest_email.toLowerCase().includes(searchEmail.toLowerCase()));
      return statusMatch && emailMatch;
    });
  }, [appointments, statusFilter, searchEmail]);

  const getServiceName = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Unknown Service';
  };

  const getStaffName = (staffId: number) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown Staff';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      setIsUpdating(true);
      await trpc.cancelAppointment.mutate({ appointmentId });
      onAppointmentUpdate();
    }  catch (error) {
      console.error('Failed to cancel appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: number, status: string) => {
    try {
      setIsUpdating(true);
      await trpc.updateAppointment.mutate({ 
        id: appointmentId, 
        status: status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
      });
      onAppointmentUpdate();
    } catch (error) {
      console.error('Failed to update appointment status:', error);
      alert('Failed to update appointment status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const upcomingAppointments = filteredAppointments.filter((apt: Appointment) => 
    new Date(apt.appointment_date) >= new Date() && apt.status !== 'cancelled'
  );

  const pastAppointments = filteredAppointments.filter((apt: Appointment) => 
    new Date(apt.appointment_date) < new Date() || apt.status === 'cancelled' || apt.status === 'completed'
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Appointments</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-search">Search by Email</Label>
              <Input
                id="email-search"
                type="email"
                placeholder="Enter email address..."
                value={searchEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchEmail(e.target.value)}
                className="border-slate-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <span>Upcoming Appointments ({upcomingAppointments.length})</span>
          </h2>
          <div className="grid gap-4">
            {upcomingAppointments.map((appointment: Appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                getServiceName={getServiceName}
                getStaffName={getStaffName}
                getStatusColor={getStatusColor}
                onCancel={handleCancelAppointment}
                onUpdateStatus={handleUpdateStatus}
                isUpdating={isUpdating}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-slate-600" />
            <span>Past Appointments ({pastAppointments.length})</span>
          </h2>
          <div className="grid gap-4">
            {pastAppointments.map((appointment: Appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                getServiceName={getServiceName}
                getStaffName={getStaffName}
                getStatusColor={getStatusColor}
                onCancel={handleCancelAppointment}
                onUpdateStatus={handleUpdateStatus}
                isUpdating={isUpdating}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {filteredAppointments.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No Appointments Found</h3>
            <p className="text-slate-500">
              {searchEmail || statusFilter !== 'all' 
                ? 'Try adjusting your filters to see more appointments.' 
                : 'No appointments have been booked yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  getServiceName: (serviceId: number) => string;
  getStaffName: (staffId: number) => string;
  getStatusColor: (status: string) => string;
  onCancel: (appointmentId: number) => Promise<void>;
  onUpdateStatus: (appointmentId: number, status: string) => Promise<void>;
  isUpdating: boolean;
  showActions: boolean;
}

function AppointmentCard({
  appointment,
  getServiceName,
  getStaffName,
  getStatusColor,
  onCancel,
  onUpdateStatus,
  isUpdating,
  showActions
}: AppointmentCardProps) {
  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{getServiceName(appointment.service_id)}</CardTitle>
            <CardDescription className="flex items-center space-x-4 mt-1">
              <span className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{getStaffName(appointment.staff_id)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{appointment.appointment_date.toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{appointment.start_time} - {appointment.end_time}</span>
              </span>
            </CardDescription>
          </div>
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Customer/Guest Info */}
        <div className="space-y-2">
          {appointment.guest_first_name && appointment.guest_last_name && (
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-slate-500" />
              <span>{appointment.guest_first_name} {appointment.guest_last_name}</span>
            </div>
          )}
          {appointment.guest_email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-slate-500" />
              <span>{appointment.guest_email}</span>
            </div>
          )}
          {appointment.guest_phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-slate-500" />
              <span>{appointment.guest_phone}</span>
            </div>
          )}
          {appointment.notes && (
            <div className="flex items-start space-x-2 text-sm">
              <MessageSquare className="h-4 w-4 text-slate-500 mt-0.5" />
              <span className="text-slate-600">{appointment.notes}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && appointment.status !== 'cancelled' && (
          <div className="flex space-x-2 pt-2 border-t">
            <Select onValueChange={(status) => onUpdateStatus(appointment.id, status)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirm</SelectItem>
                <SelectItem value="completed">Mark Complete</SelectItem>
                <SelectItem value="no_show">Mark No Show</SelectItem>
              </SelectContent>
            </Select>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this appointment? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onCancel(appointment.id)}
                    disabled={isUpdating}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isUpdating ? 'Cancelling...' : 'Cancel Appointment'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
