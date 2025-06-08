
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Briefcase, BarChart3, Plus, Edit, Calendar, DollarSign } from 'lucide-react';
import { useState, useMemo } from 'react';
import { trpc } from '@/utils/trpc';
import type { Service, Staff, Appointment, CreateServiceInput, CreateStaffInput, UpdateServiceInput, UpdateStaffInput } from '../../../server/src/schema';

interface AdminPanelProps {
  services: Service[];
  staff: Staff[];
  appointments: Appointment[];
  onDataUpdate: () => void;
}

export function AdminPanel({ services, staff, appointments, onDataUpdate }: AdminPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Service form state
  const [serviceForm, setServiceForm] = useState<CreateServiceInput>({
    name: '',
    description: null,
    duration_minutes: 30,
    price: 0
  });
  
  // Staff form state
  const [staffForm, setStaffForm] = useState<CreateStaffInput>({
    email: '',
    first_name: '',
    last_name: '',
    phone: null,
    role: 'staff'
  });

  // Edit states
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
    const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length;
    const totalRevenue = appointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => {
        const service = services.find(s => s.id === apt.service_id);
        return sum + (service?.price || 0);
      }, 0);

    return {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      totalRevenue,
      activeServices: services.filter(s => s.is_active).length,
      activeStaff: staff.filter(s => s.is_active).length
    };
  }, [appointments, services, staff]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createService.mutate(serviceForm);
      setServiceForm({
        name: '',
        description: null,
        duration_minutes: 30,
        price: 0
      });
      onDataUpdate();
    } catch (error) {
      console.error('Failed to create service:', error);
      alert('Failed to create service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createStaff.mutate(staffForm);
      setStaffForm({
        email: '',
        first_name: '',
        last_name: '',
        phone: null,
        role: 'staff'
      });
      onDataUpdate();
    } catch (error) {
      console.error('Failed to create staff:', error);
      alert('Failed to create staff member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateServiceInput = {
        id: editingService.id,
        name: editingService.name,
        description: editingService.description,
        duration_minutes: editingService.duration_minutes,
        price: editingService.price,
        is_active: editingService.is_active
      };
      await trpc.updateService.mutate(updateData);
      setEditingService(null);
      onDataUpdate();
    } catch (error) {
      console.error('Failed to update service:', error);
      alert('Failed to update service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateStaffInput = {
        id: editingStaff.id,
        email: editingStaff.email,
        first_name: editingStaff.first_name,
        last_name: editingStaff.last_name,
        phone: editingStaff.phone,
        role: editingStaff.role,
        is_active: editingStaff.is_active
      };
      await trpc.updateStaff.mutate(updateData);
      setEditingStaff(null);
      onDataUpdate();
    } catch (error) {
      console.error('Failed to update staff:', error);
      alert('Failed to update staff member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xl font-bold">{stats.totalAppointments}</p>
                <p className="text-xs text-slate-600">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xl font-bold">${stats.totalRevenue.toFixed(0)}</p>
                <p className="text-xs text-slate-600">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xl font-bold">{stats.activeServices}</p>
                <p className="text-xs text-slate-600">Active Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-xl font-bold">{stats.activeStaff}</p>
                <p className="text-xs text-slate-600">Active Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <div>
                <p className="text-xl font-bold">{stats.completedAppointments}</p>
                <p className="text-xs text-slate-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs">✕</span>
              </div>
              <div>
                <p className="text-xl font-bold">{stats.cancelledAppointments}</p>
                <p className="text-xs text-slate-600">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Service */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add New Service</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateService} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="service_name">Service Name</Label>
                    <Input
                      id="service_name"
                      value={serviceForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setServiceForm(prev => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service_description">Description</Label>
                    <Textarea
                      id="service_description"
                      value={serviceForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setServiceForm(prev => ({ ...prev, description: e.target.value || null }))
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="15"
                        step="15"
                        value={serviceForm.duration_minutes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setServiceForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={serviceForm.price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setServiceForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Creating...' : 'Create Service'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Services List */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Existing Services</CardTitle>
                <CardDescription>{services.length} services total</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {services.map((service: Service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{service.name}</h4>
                          <Badge variant={service.is_active ? "default" : "secondary"}>
                            {service.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">${service.price.toFixed(2)} • {service.duration_minutes}min</p>
                        {service.description && (
                          <p className="text-xs text-slate-500 mt-1">{service.description}</p>
                        )}
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingService(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Service</DialogTitle>
                            <DialogDescription>Update service details</DialogDescription>
                          </DialogHeader>
                          {editingService && (
                            <form onSubmit={handleUpdateService} className="space-y-4">
                              <div className="space-y-2">
                                <Label>Service Name</Label>
                                <Input
                                  value={editingService.name}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditingService(prev => prev ? { ...prev, name: e.target.value } : null)
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={editingService.description || ''}
                                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setEditingService(prev => prev ? { ...prev, description: e.target.value || null } : null)
                                  }
                                  rows={3}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Duration (minutes)</Label>
                                  <Input
                                    type="number"
                                    min="15"
                                    step="15"
                                    value={editingService.duration_minutes}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setEditingService(prev => prev ? { ...prev, duration_minutes: parseInt(e.target.value) || 30 } : null)
                                    }
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Price ($)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editingService.price}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setEditingService(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)
                                    }
                                    required
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={editingService.is_active}
                                  onCheckedChange={(checked) =>
                                    setEditingService(prev => prev ? { ...prev, is_active: checked } : null)
                                  }
                                />
                                <Label>Active</Label>
                              </div>
                              <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                  {isLoading ? 'Updating...' : 'Update Service'}
                                </Button>
                              </DialogFooter>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Staff */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add New Staff</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStaff} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={staffForm.first_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setStaffForm(prev => ({ ...prev, first_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={staffForm.last_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setStaffForm(prev => ({ ...prev, last_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={staffForm.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setStaffForm(prev => ({ ...prev, email: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={staffForm.phone || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setStaffForm(prev => ({ ...prev, phone: e.target.value || null }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={staffForm.role || ''} onValueChange={(value: 'staff' | 'admin') => setStaffForm(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Creating...' : 'Create Staff Member'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Staff List */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Staff Members</CardTitle>
                <CardDescription>{staff.length} staff members total</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {staff.map((member: Staff) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{member.first_name} {member.last_name}</h4>
                          <Badge variant={member.role === 'admin' ? "default" : "secondary"}>
                            {member.role}
                          </Badge>
                          <Badge variant={member.is_active ? "default" : "secondary"}>
                            {member.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{member.email}</p>
                        {member.phone && (
                          <p className="text-xs text-slate-500">{member.phone}</p>
                        )}
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingStaff(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Staff Member</DialogTitle>
                            <DialogDescription>Update staff details</DialogDescription>
                          </DialogHeader>
                          {editingStaff && (
                            <form onSubmit={handleUpdateStaff} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>First Name</Label>
                                  <Input
                                    value={editingStaff.first_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setEditingStaff(prev => prev ? { ...prev, first_name: e.target.value } : null)
                                    }
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Last Name</Label>
                                  <Input
                                    value={editingStaff.last_name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setEditingStaff(prev => prev ? { ...prev, last_name: e.target.value } : null)
                                    }
                                    required
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                  type="email"
                                  value={editingStaff.email}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditingStaff(prev => prev ? { ...prev, email: e.target.value } : null)
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                  type="tel"
                                  value={editingStaff.phone || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditingStaff(prev => prev ? { ...prev, phone: e.target.value || null } : null)
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Role</Label>
                                <Select 
                                  value={editingStaff.role || ''} 
                                  onValueChange={(value: 'staff' | 'admin') => setEditingStaff(prev => prev ? { ...prev, role: value } : null)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={editingStaff.is_active}
                                  onCheckedChange={(checked) =>
                                    setEditingStaff(prev => prev ? { ...prev, is_active: checked } : null)
                                  }
                                />
                                <Label>Active</Label>
                              </div>
                              <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                  {isLoading ? 'Updating...' : 'Update Staff'}
                                </Button>
                              </DialogFooter>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Business Reports</span>
              </CardTitle>
              <CardDescription>Overview of your business performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-medium text-slate-600">Completion Rate</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalAppointments > 0 
                      ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-medium text-slate-600">Cancellation Rate</h4>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.totalAppointments > 0 
                      ? Math.round((stats.cancelledAppointments / stats.totalAppointments) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-medium text-slate-600">Avg. Revenue/Appointment</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    ${stats.completedAppointments > 0 
                      ? (stats.totalRevenue / stats.completedAppointments).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-medium text-slate-600">Service Utilization</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {services.length > 0 ? Math.round((stats.activeServices / services.length) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="font-medium mb-3">Recent Appointments</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {appointments
                    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
                    .slice(0, 10)
                    .map((appointment: Appointment) => {
                      const service = services.find(s => s.id === appointment.service_id);
                      const staffMember = staff.find(s => s.id === appointment.staff_id);
                      
                      return (
                        <div key={appointment.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg text-sm">
                          <div className="flex items-center space-x-3">
                            <Badge className={
                              appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {appointment.status}
                            </Badge>
                            <span className="font-medium">{service?.name || 'Unknown Service'}</span>
                            <span className="text-slate-600">
                              {appointment.guest_first_name} {appointment.guest_last_name}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-600">{appointment.appointment_date.toLocaleDateString()}</p>
                            <p className="text-xs text-slate-500">
                              {staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown Staff'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
