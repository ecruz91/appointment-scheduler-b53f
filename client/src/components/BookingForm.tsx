
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Service, Staff, AvailableSlot, CreateAppointmentInput } from '../../../server/src/schema';

interface BookingFormProps {
  services: Service[];
  staff: Staff[];
  onBookingComplete: () => void;
}

export function BookingForm({ services, staff, onBookingComplete }: BookingFormProps) {
  const [bookingType, setBookingType] = useState<'guest' | 'customer'>('guest');
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState<CreateAppointmentInput>({
    customer_id: null,
    staff_id: 0,
    service_id: 0,
    guest_email: null,
    guest_first_name: null,
    guest_last_name: null,
    guest_phone: null,
    appointment_date: new Date(),
    start_time: '',
    notes: null
  });

  const loadAvailableSlots = useCallback(async () => {
    if (!selectedService || !selectedStaff || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    try {
      setIsLoadingSlots(true);
      const slots = await trpc.getAvailableSlots.query({
        service_id: selectedService,
        staff_id: selectedStaff,
        date: new Date(selectedDate)
      });
      setAvailableSlots(slots);
      setSelectedSlot('');
    } catch (error) {
      console.error('Failed to load available slots:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedService, selectedStaff, selectedDate]);

  useEffect(() => {
    loadAvailableSlots();
  }, [loadAvailableSlots]);

  const handleServiceChange = (serviceId: string) => {
    const id = parseInt(serviceId);
    setSelectedService(id);
    setFormData((prev: CreateAppointmentInput) => ({ ...prev, service_id: id }));
  };

  const handleStaffChange = (staffId: string) => {
    const id = parseInt(staffId);
    setSelectedStaff(id);
    setFormData((prev: CreateAppointmentInput) => ({ ...prev, staff_id: id }));
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setFormData((prev: CreateAppointmentInput) => ({ 
      ...prev, 
      appointment_date: new Date(date) 
    }));
  };

  const handleSlotChange = (slot: string) => {
    setSelectedSlot(slot);
    setFormData((prev: CreateAppointmentInput) => ({ ...prev, start_time: slot }));
  };

  const handleBookingTypeChange = (value: string) => {
    if (value === 'guest' || value === 'customer') {
      setBookingType(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedStaff || !selectedDate || !selectedSlot) {
      return;
    }

    setIsSubmitting(true);
    try {
      const appointmentData: CreateAppointmentInput = {
        ...formData,
        service_id: selectedService,
        staff_id: selectedStaff,
        appointment_date: new Date(selectedDate),
        start_time: selectedSlot
      };

      await trpc.createAppointment.mutate(appointmentData);
      
      // Reset form
      setSelectedService(null);
      setSelectedStaff(null);
      setSelectedDate('');
      setSelectedSlot('');
      setFormData({
        customer_id: null,
        staff_id: 0,
        service_id: 0,
        guest_email: null,
        guest_first_name: null,
        guest_last_name: null,
        guest_phone: null,
        appointment_date: new Date(),
        start_time: '',
        notes: null
      });
      
      onBookingComplete();
      alert('Appointment booked successfully! You will receive a confirmation email shortly.');
    } catch (error) {
      console.error('Failed to book appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedServiceData = services.find(s => s.id === selectedService);
  const selectedStaffData = staff.find(s => s.id === selectedStaff);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Booking Type Selection */}
      <Tabs value={bookingType} onValueChange={handleBookingTypeChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guest">Book as Guest</TabsTrigger>
          <TabsTrigger value="customer">Customer Account</TabsTrigger>
        </TabsList>

        <TabsContent value="guest" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest_first_name" className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>First Name</span>
              </Label>
              <Input
                id="guest_first_name"
                value={formData.guest_first_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateAppointmentInput) => ({ 
                    ...prev, 
                    guest_first_name: e.target.value || null 
                  }))
                }
                required
                className="border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest_last_name" className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Last Name</span>
              </Label>
              <Input
                id="guest_last_name"
                value={formData.guest_last_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateAppointmentInput) => ({ 
                    ...prev, 
                    guest_last_name: e.target.value || null 
                  }))
                }
                required
                className="border-slate-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest_email" className="flex items-center space-x-1">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </Label>
              <Input
                id="guest_email"
                type="email"
                value={formData.guest_email || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateAppointmentInput) => ({ 
                    ...prev, 
                    guest_email: e.target.value || null 
                  }))
                }
                required
                className="border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest_phone" className="flex items-center space-x-1">
                <Phone className="h-4 w-4" />
                <span>Phone (Optional)</span>
              </Label>
              <Input
                id="guest_phone"
                type="tel"
                value={formData.guest_phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateAppointmentInput) => ({ 
                    ...prev, 
                    guest_phone: e.target.value || null 
                  }))
                }
                className="border-slate-300"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customer" className="mt-6">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-slate-600 text-center">
                Customer account login will be implemented in the next phase. 
                For now, please book as a guest.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Selection */}
      <div className="space-y-2">
        <Label className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>Select Service</span>
        </Label>
        <Select value={selectedService?.toString() || ''} onValueChange={handleServiceChange}>
          <SelectTrigger className="border-slate-300">
            <SelectValue placeholder="Choose a service" />
          </SelectTrigger>
          <SelectContent>
            {services.filter(service => service.is_active).map((service: Service) => (
              <SelectItem key={service.id} value={service.id.toString()}>
                <div className="flex justify-between items-center w-full">
                  <span>{service.name}</span>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge variant="secondary">{service.duration_minutes}min</Badge>
                    <Badge variant="outline">${service.price.toFixed(2)}</Badge>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedServiceData && (
          <p className="text-sm text-slate-600 mt-1">
            {selectedServiceData.description}
          </p>
        )}
      </div>

      {/* Staff Selection */}
      <div className="space-y-2">
        <Label className="flex items-center space-x-1">
          <User className="h-4 w-4" />
          <span>Select Staff Member</span>
        </Label>
        <Select value={selectedStaff?.toString() || ''} onValueChange={handleStaffChange}>
          <SelectTrigger className="border-slate-300">
            <SelectValue placeholder="Choose a staff member" />
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

      {/* Date Selection */}
      <div className="space-y-2">
        <Label htmlFor="appointment_date" className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>Select Date</span>
        </Label>
        <Input
          id="appointment_date"
          type="date"
          min={today}
          value={selectedDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateChange(e.target.value)}
          className="border-slate-300"
          required
        />
      </div>

      {/* Time Slot Selection */}
      {selectedService && selectedStaff && selectedDate && (
        <div className="space-y-2">
          <Label className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Available Time Slots</span>
          </Label>
          {isLoadingSlots ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-slate-600">Loading available slots...</span>
            </div>
          ) : availableSlots.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-4 text-center">
                <p className="text-slate-600">No available slots for the selected date and service.</p>
                <p className="text-sm text-slate-500 mt-1">Please try a different date.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableSlots.map((slot: AvailableSlot, index: number) => (
                <Button
                  key={index}
                  type="button"
                  variant={selectedSlot === slot.start_time ? "default" : "outline"}
                  onClick={() => handleSlotChange(slot.start_time)}
                  className="text-sm"
                >
                  {slot.start_time}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center space-x-1">
          <MessageSquare className="h-4 w-4" />
          <span>Special Notes (Optional)</span>
        </Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateAppointmentInput) => ({ 
              ...prev, 
              notes: e.target.value || null 
            }))
          }
          placeholder="Any special requests or notes for your appointment..."
          className="border-slate-300"
          rows={3}
        />
      </div>

      {/* Summary */}
      {selectedServiceData && selectedStaffData && selectedDate && selectedSlot && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Appointment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Service:</span>
              <span className="font-medium">{selectedServiceData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Staff:</span>
              <span className="font-medium">{selectedStaffData.first_name} {selectedStaffData.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Date:</span>
              <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Time:</span>
              <span className="font-medium">{selectedSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Duration:</span>
              <span className="font-medium">{selectedServiceData.duration_minutes} minutes</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-slate-600">Total:</span>
              <span className="font-bold text-lg">${selectedServiceData.price.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={!selectedService || !selectedStaff || !selectedDate || !selectedSlot || isSubmitting}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Booking Appointment...
          </>
        ) : (
          'Book Appointment'
        )}
      </Button>
    </form>
  );
}
