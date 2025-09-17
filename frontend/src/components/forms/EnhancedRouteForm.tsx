import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Clock, MapPin, ArrowDown, Move } from "lucide-react";
import { FormInput } from "../ui/FormInput";
import ModernButton from "../ui/ModernButton";
import ModernCard from "../ui/ModernCard";
import { cn } from "../../utils/cn";
import './EnhancedRouteForm.css';

interface Stop {
  id: string;
  name: string;
  arrivalTime: string;
  departureTime: string;
  waitTime: number; // in minutes
  isTerminal?: boolean;
}

interface EnhancedFormData {
  busNumber: string;
  route: string;
  origin: string;
  destination: string;
  operatingHours: string;
  departureTime: string;
  arrivalTime: string;
  stops: Stop[];
  frequency: string; // e.g., "Every 30 minutes"
  notes: string;
}

interface EnhancedRouteFormProps {
  onSubmit: (data: any) => void;
}

export const EnhancedRouteForm: React.FC<EnhancedRouteFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<EnhancedFormData>({
    busNumber: '',
    route: '',
    origin: '',
    destination: '',
    operatingHours: '',
    departureTime: '',
    arrivalTime: '',
    stops: [],
    frequency: '',
    notes: ''
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const enhancedData = {
      ...formData,
      fromLocationName: formData.origin || 'Unknown Origin',
      toLocationName: formData.destination || 'Unknown Destination',
      busName: formData.route || formData.busNumber || 'Unknown Bus',
      detailedStops: formData.stops,
      totalStops: formData.stops.length,
      estimatedJourneyTime: calculateTotalJourneyTime()
    };
    
    onSubmit(enhancedData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Add new stop
  const addStop = () => {
    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      name: '',
      arrivalTime: '',
      departureTime: '',
      waitTime: 2, // Default 2 minutes wait time
      isTerminal: false
    };
    
    setFormData({
      ...formData,
      stops: [...formData.stops, newStop]
    });
  };

  // Update stop
  const updateStop = (id: string, field: keyof Stop, value: string | number | boolean) => {
    setFormData({
      ...formData,
      stops: formData.stops.map(stop => 
        stop.id === id ? { ...stop, [field]: value } : stop
      )
    });
  };

  // Remove stop
  const removeStop = (id: string) => {
    setFormData({
      ...formData,
      stops: formData.stops.filter(stop => stop.id !== id)
    });
  };

  // Calculate journey duration
  const calculateJourneyDuration = (departureTime: string, arrivalTime: string): string => {
    if (!departureTime || !arrivalTime) return '';
    
    const departure = new Date(`2000-01-01T${departureTime}`);
    const arrival = new Date(`2000-01-01T${arrivalTime}`);
    let diffMs = arrival.getTime() - departure.getTime();
    
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Handle overnight journeys
    }
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  };

  // Calculate total journey time including stops
  const calculateTotalJourneyTime = (): string => {
    if (!formData.departureTime || !formData.arrivalTime) return '';
    
    const baseTime = calculateJourneyDuration(formData.departureTime, formData.arrivalTime);
    const totalWaitTime = formData.stops.reduce((total, stop) => total + stop.waitTime, 0);
    
    if (totalWaitTime > 0) {
      return `${baseTime} (includes ${totalWaitTime} min stops)`;
    }
    
    return baseTime;
  };

  // Auto-fill stop times based on journey progression
  const autoFillStopTimes = () => {
    if (!formData.departureTime || !formData.arrivalTime || formData.stops.length === 0) return;
    
    const departure = new Date(`2000-01-01T${formData.departureTime}`);
    const arrival = new Date(`2000-01-01T${formData.arrivalTime}`);
    const totalJourneyMs = arrival.getTime() - departure.getTime();
    const totalStops = formData.stops.length;
    
    const updatedStops = formData.stops.map((stop, index) => {
      const progressRatio = (index + 1) / (totalStops + 1);
      const stopTimeMs = departure.getTime() + (totalJourneyMs * progressRatio);
      const stopTime = new Date(stopTimeMs);
      
      const arrivalTime = stopTime.toTimeString().slice(0, 5);
      const departureMs = stopTimeMs + (stop.waitTime * 60 * 1000);
      const departureTime = new Date(departureMs).toTimeString().slice(0, 5);
      
      return {
        ...stop,
        arrivalTime,
        departureTime
      };
    });
    
    setFormData({
      ...formData,
      stops: updatedStops
    });
  };

  // Drag and drop functionality
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;
    
    const updatedStops = [...formData.stops];
    const [draggedStop] = updatedStops.splice(draggedIndex, 1);
    updatedStops.splice(dropIndex, 0, draggedStop);
    
    setFormData({
      ...formData,
      stops: updatedStops
    });
    
    setDraggedIndex(null);
  };

  return (
    <form onSubmit={handleSubmit} className="enhanced-route-form">
      {/* Basic Route Information */}
      <ModernCard variant="default" padding="lg" className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🚌</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Route Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            id="busNumber"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleChange}
            label="Bus Number"
            placeholder="e.g., 27D, 570, MTC-123"
            icon="🚌"
            required
          />
          
          <FormInput
            id="route"
            name="route"
            value={formData.route}
            onChange={handleChange}
            label="Route Name"
            placeholder="e.g., Chennai Central - Tambaram Express"
            icon="🛣️"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <FormInput
              id="origin"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              label="Origin Terminal"
              placeholder="e.g., Chennai Central"
              icon="📍"
              required
            />
            <FormInput
              id="departureTime"
              name="departureTime"
              type="time"
              value={formData.departureTime}
              onChange={handleChange}
              label="First Departure"
              required
            />
          </div>
          
          <div className="space-y-2">
            <FormInput
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              label="Destination Terminal"
              placeholder="e.g., Madurai"
              icon="🏁"
              required
            />
            <FormInput
              id="arrivalTime"
              name="arrivalTime"
              type="time"
              value={formData.arrivalTime}
              onChange={handleChange}
              label="Final Arrival"
              required
            />
          </div>
        </div>

        {/* Journey Summary */}
        {formData.departureTime && formData.arrivalTime && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Total Journey Time:</span>
              </div>
              <span className="text-blue-700 font-semibold">
                {calculateTotalJourneyTime()}
              </span>
            </div>
          </div>
        )}
      </ModernCard>

      {/* Stops Management */}
      <ModernCard variant="default" padding="lg" className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Stops & Timing ({formData.stops.length} stops)
            </h3>
          </div>
          
          <div className="flex gap-2">
            {formData.stops.length > 0 && (
              <ModernButton
                type="button"
                variant="outline"
                size="sm"
                onClick={autoFillStopTimes}
                leftIcon={Clock}
              >
                Auto-fill Times
              </ModernButton>
            )}
            <ModernButton
              type="button"
              variant="primary"
              size="sm"
              onClick={addStop}
              leftIcon={Plus}
            >
              Add Stop
            </ModernButton>
          </div>
        </div>

        {formData.stops.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No stops added yet</h4>
            <p className="text-gray-600 mb-4">
              Add intermediate stops with specific timings for better route tracking
            </p>
            <ModernButton
              type="button"
              variant="primary"
              onClick={addStop}
              leftIcon={Plus}
            >
              Add First Stop
            </ModernButton>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.stops.map((stop, index) => (
              <div
                key={stop.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  "bg-white border-2 border-gray-200 rounded-xl p-4 transition-all duration-200",
                  "hover:border-gray-300 hover:shadow-md",
                  draggedIndex === index && "opacity-50 scale-95"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="flex flex-col items-center">
                    <Move className="w-4 h-4 text-gray-400 cursor-move" />
                    <span className="text-xs text-gray-500 mt-1">#{index + 1}</span>
                  </div>
                  
                  {/* Stop Name */}
                  <div className="flex-1">
                    <FormInput
                      id={`stop-name-${stop.id}`}
                      value={stop.name}
                      onChange={(e) => updateStop(stop.id, 'name', e.target.value)}
                      placeholder="Stop name"
                    />
                  </div>
                  
                  {/* Arrival Time */}
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Arrival
                    </label>
                    <input
                      type="time"
                      value={stop.arrivalTime}
                      onChange={(e) => updateStop(stop.id, 'arrivalTime', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Departure Time */}
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Departure
                    </label>
                    <input
                      type="time"
                      value={stop.departureTime}
                      onChange={(e) => updateStop(stop.id, 'departureTime', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Wait Time */}
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Wait (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={stop.waitTime}
                      onChange={(e) => updateStop(stop.id, 'waitTime', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Remove Button */}
                  <ModernButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeStop(stop.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </ModernButton>
                </div>
                
                {/* Journey indicator */}
                {index < formData.stops.length - 1 && (
                  <div className="flex justify-center mt-3">
                    <ArrowDown className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ModernCard>

      {/* Additional Information */}
      <ModernCard variant="default" padding="lg" className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ℹ️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Additional Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            id="operatingHours"
            name="operatingHours"
            value={formData.operatingHours}
            onChange={handleChange}
            label="Operating Hours"
            placeholder="e.g., 6:00 AM - 10:00 PM"
            icon="🕐"
          />
          
          <FormInput
            id="frequency"
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            label="Service Frequency"
            placeholder="e.g., Every 30 minutes"
            icon="⏱️"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any additional information about the route, special conditions, or notes for travelers..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
      </ModernCard>

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <ModernButton
          type="submit"
          variant="gradient"
          size="lg"
          className="min-w-64"
        >
          🚌 Submit Route Information
        </ModernButton>
      </div>
    </form>
  );
};