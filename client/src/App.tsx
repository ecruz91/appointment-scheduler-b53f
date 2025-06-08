
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Settings, BookOpen, BarChart3, Scissors, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Service, Staff, Appointment } from '../../server/src/schema';

// Import components
import { BookingForm } from '@/components/BookingForm';
import { AppointmentList } from '@/components/AppointmentList';
import { AdminPanel } from '@/components/AdminPanel';
import { StaffDashboard } from '@/components/StaffDashboard';

function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState('book');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [servicesData, staffData, appointmentsData] = await Promise.all([
        trpc.getServices.query(),
        trpc.getStaff.query(),
        trpc.getAppointments.query({})
      ]);
      
      setServices(servicesData);
      setStaff(staffData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your spa experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SerenityBooking
                </h1>
                <p className="text-sm text-slate-600">Professional Appointment Scheduling</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {services.length} Services Available
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {staff.filter(s => s.is_active).length} Staff Active
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="book" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Book Appointment</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>My Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Staff Portal</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Admin Panel</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="book" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
              <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
                  <Scissors className="h-6 w-6 text-blue-600" />
                  <span>Book Your Appointment</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  Choose your preferred service, staff member, and time slot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BookingForm 
                  services={services} 
                  staff={staff} 
                  onBookingComplete={loadData}
                />
              </CardContent>
            </Card>

            {/* Services Showcase */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span>Our Services</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.filter(service => service.is_active).map((service: Service) => (
                    <Card key={service.id} className="border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                        {service.description && (
                          <p className="text-slate-600 text-sm mb-3">{service.description}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{service.duration_minutes} min</span>
                          </div>
                          <span className="font-bold text-blue-600">${service.price.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <span>Appointment Management</span>
                </CardTitle>
                <CardDescription>
                  View, reschedule, or cancel your appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentList 
                  appointments={appointments} 
                  services={services}
                  staff={staff}
                  onAppointmentUpdate={loadData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-orange-600" />
                  <span>Staff Dashboard</span>
                </CardTitle>
                <CardDescription>
                  Manage your schedule and availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaffDashboard 
                  staff={staff}
                  services={services}
                  appointments={appointments}
                  onDataUpdate={loadData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-red-600" />
                  <span>Admin Panel</span>
                </CardTitle>
                <CardDescription>
                  Manage services, staff, and view reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminPanel 
                  services={services}
                  staff={staff}
                  appointments={appointments}
                  onDataUpdate={loadData}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-slate-600">
            <p>&copy; 2024 SerenityBooking. Crafted for wellness professionals.</p>
            <p className="text-sm mt-1">Experience seamless appointment scheduling</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
