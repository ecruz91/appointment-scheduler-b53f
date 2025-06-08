
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { Staff, Service, Appointment, StaffAvailability, CreateStaffAvailabilityInput, AppointmentStats } from '../../../server/src/schema';

interface StaffDashboardProps {
  staff: Staff[];
  services: Service[];
  appointments: Appointment[];
  onDataUpdate: () => void;
}

export function StaffDashboard({ staff, services, appointments }: StaffDashboardProps) {
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [staffAvailability, setStaffAvailability] = useState<StaffAvailability[]>([]);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Availability form state
  const [availabilityForm, setAvailabilityForm] = useState<CreateStaffAvailabilityInput>({
    staff_id: 0,
    day_of_week: 'monday',
    start_time: '09:00',
    end_time: '17:00'
  });

  const selectedStaffData = staff.find(s => s.id === selectedStaff);

  const loadStaffData = useCallback(async (staffId: number) => {
    try {
      setIsLoading(true);
      const [availability, stats] = await Promise.all([
        trpc.getStaffAvailability.query({ staffId }),
        trpc.getAppointmentStats.query({ staffId })
      ]);
      setStaffAvailability(availability);
      setAppointmentStats(stats);
    } catch (error) {
      console.error('Failed to load staff data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      loadStaffData(selectedStaff);
      setAvailabilityForm(prev => ({ ...prev, staff_id: selectedStaff }));
    }
  }, [selectedStaff, loadStaffData]);

  const staffAppointments = useMemo(() => {
    if (!selectedStaff) return [];
    return appointments.filter((apt: Appointment) => apt.staff_id === selectedStaff);
  }, [appointments, selectedStaff]);

  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return staffAppointments.filter((apt: Appointment) => 
      apt.appointment_date.toDateString() === today
    );
  }, [staffAppointments]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return staffAppointments.filter((apt: Appointment) => 
      apt.appointment_date >= now && apt.status !== 'cancelled'
    );
  }, [staffAppointments]);

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      await trpc.createStaffAvailability.mutate(availabilityForm);
      await loadStaffData(selectedStaff);
      setAvailabilityForm({
        staff_id: selectedStaff,
        day_of_week: 'monday',
        start_time: '09:00',
        end_time: '17:00'
      });
    } catch (error) {
      console.error('Failed to add availability:', error);
      alert('Failed to add availability. Please try again.');
    }
  };

  const getServiceName = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Unknown Service';
  };

  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  if (!selectedStaff) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Select Staff Member</CardTitle>
          <CardDescription>Choose a staff member to view their dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedStaff?.toString() || ''} onValueChange={(value) => setSelectedStaff(parseInt(value))}>
            <SelectTrigger className="border-slate-300">
              <SelectValue placeholder="Choose staff member" />
            </SelectTrigger>
            <SelectContent>
              {staff.filter(member => member.is_active).map((member: Staff) => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  {member.first_name} {member.last_name} - {member.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staff Selection */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{selectedStaffData?.first_name} {selectedStaffData?.last_name}</h3>
                <p className="text-sm text-slate-600 capitalize">{selectedStaffData?.role}</p>
              </div>
            </div>
            <Select value={selectedStaff.toString()} onValueChange={(value) => setSelectedStaff(parseInt(value))}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {staff.filter(member => member.is_active).map((member: Staff) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.first_name} {member.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {appointmentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{appointmentStats.total_appointments}</p>
                  <p className="text-sm text-slate-600">Total Appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{appointmentStats.completed_appointments}</p>
                  <p className="text-sm text-slate-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{appointmentStats.cancelled_appointments}</p>
                  <p className="text-sm text-slate-600">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">$</span>
                </div>
                <div>
                  <p className="text-2xl font-bold">${appointmentStats.revenue.toFixed(2)}</p>
                  <p className="text-sm text-slate-600">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Today's Appointments ({todayAppointments.length})</span>
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppointments
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((appointment: Appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <p className="font-semibold">{appointment.start_time}</p>
                          <p className="text-xs text-slate-600">{appointment.end_time}</p>
                        </div>
                        <div>
                          <p className="font-medium">{getServiceName(appointment.service_id)}</p>
                          <p className="text-sm text-slate-600">
                            {appointment.guest_first_name} {appointment.guest_last_name}
                          </p>
                          {appointment.guest_phone && (
                            <p className="text-xs text-slate-500">{appointment.guest_phone}</p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        className={
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Manage Availability</span>
              </CardTitle>
              <CardDescription>Set your working hours for each day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Availability */}
              <div>
                <h4 className="font-medium mb-3">Current Schedule</h4>
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : staffAvailability.length === 0 ? (
                  <p className="text-slate-600 text-center py-4">No availability set</p>
                ) : (
                  <div className="grid gap-2">
                    {staffAvailability
                      .sort((a, b) => {
                        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                        return days.indexOf(a.day_of_week) - days.indexOf(b.day_of_week);
                      })
                      .map((availability: StaffAvailability) => (
                      <div key={availability.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <span className="font-medium">{dayNames[availability.day_of_week]}</span>
                        <span className="text-slate-600">
                          {availability.start_time} - {availability.end_time}
                        </span>
                        <Badge variant={availability.is_active ? "default" : "secondary"}>
                          {availability.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Availability */}
              <div className="border-t pt-6">
                <h4 className="font-medium mb-3">Add New Availability</h4>
                <form onSubmit={handleAddAvailability} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Day of Week</Label>
                      <Select 
                        value={availabilityForm.day_of_week} 
                        onValueChange={(value: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday') => 
                          setAvailabilityForm(prev => ({ ...prev, day_of_week: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(dayNames).map(([key, name]) => (
                            <SelectItem key={key} value={key}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={availabilityForm.start_time}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAvailabilityForm(prev => ({ ...prev, start_time: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={availabilityForm.end_time}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAvailabilityForm(prev => ({ ...prev, end_time: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <Button type="submit" className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Availability</span>
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Upcoming Appointments ({upcomingAppointments.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No upcoming appointments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments
                    .sort((a, b) => a.appointment_date.getTime() - b.appointment_date.getTime())
                    .map((appointment: Appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <p className="font-semibold text-sm">{appointment.appointment_date.toLocaleDateString()}</p>
                          <p className="text-xs text-slate-600">{appointment.start_time}</p>
                        </div>
                        <div>
                          <p className="font-medium">{getServiceName(appointment.service_id)}</p>
                          <p className="text-sm text-slate-600">
                            {appointment.guest_first_name} {appointment.guest_last_name}
                          </p>
                          {appointment.notes && (
                            <p className="text-xs text-slate-500 mt-1">{appointment.notes}</p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        className={
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
