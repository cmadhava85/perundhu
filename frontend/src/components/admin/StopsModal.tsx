import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  GripVertical,
  Clock,
  MapPin,
  Check,
  XCircle
} from 'lucide-react';
import BusDatabaseService from '../../services/busDatabaseService';
import type { 
  StopDetail, 
  BusDetail,
  StopInput,
  LocationSuggestion
} from '../../services/busDatabaseService';
import './StopsModal.css';

interface StopsModalProps {
  busId: number;
  onClose: () => void;
  onUpdate: () => void;
}

/**
 * Modal for viewing and editing bus stops
 */
const StopsModal: React.FC<StopsModalProps> = ({ busId, onClose, onUpdate }) => {
  const { t } = useTranslation();
  
  // State
  const [bus, setBus] = useState<BusDetail | null>(null);
  const [stops, setStops] = useState<StopDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit state
  const [editingStopId, setEditingStopId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<StopInput>({
    locationName: '',
    arrivalTime: '',
    departureTime: '',
  });
  
  // Add new stop state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStopForm, setNewStopForm] = useState<StopInput>({
    locationName: '',
    arrivalTime: '',
    departureTime: '',
  });
  
  // Location suggestions
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load bus and stops
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const busData = await BusDatabaseService.getBusById(busId);
        setBus(busData);
        setStops(busData.stops || []);
      } catch (err) {
        console.error('Failed to load bus data:', err);
        setError('Failed to load bus data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [busId]);

  // Location search with debounce
  useEffect(() => {
    if (locationQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await BusDatabaseService.searchLocations(locationQuery);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Failed to search locations:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  // Handle edit start
  const handleEditStart = (stop: StopDetail) => {
    setEditingStopId(stop.id);
    setEditForm({
      locationName: stop.locationName || stop.name,
      arrivalTime: stop.arrivalTime || '',
      departureTime: stop.departureTime || '',
    });
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingStopId(null);
    setEditForm({ locationName: '', arrivalTime: '', departureTime: '' });
  };

  // Handle edit save
  const handleEditSave = async (stopId: number) => {
    try {
      setSaving(true);
      await BusDatabaseService.updateStop(stopId, editForm);
      
      // Refresh stops
      const busData = await BusDatabaseService.getBusById(busId);
      setStops(busData.stops || []);
      setEditingStopId(null);
      onUpdate();
    } catch (err) {
      console.error('Failed to update stop:', err);
      setError('Failed to update stop');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete stop
  const handleDeleteStop = async (stopId: number) => {
    if (!confirm(t('admin.stops.deleteConfirm', 'Are you sure you want to delete this stop?'))) {
      return;
    }

    try {
      setSaving(true);
      await BusDatabaseService.deleteStop(stopId);
      
      // Refresh stops
      const busData = await BusDatabaseService.getBusById(busId);
      setStops(busData.stops || []);
      onUpdate();
    } catch (err) {
      console.error('Failed to delete stop:', err);
      setError('Failed to delete stop');
    } finally {
      setSaving(false);
    }
  };

  // Handle add new stop
  const handleAddStop = async () => {
    if (!newStopForm.locationName.trim()) {
      setError('Location name is required');
      return;
    }

    try {
      setSaving(true);
      await BusDatabaseService.addStop(busId, {
        ...newStopForm,
        stopOrder: stops.length, // Add at the end
      });
      
      // Refresh stops
      const busData = await BusDatabaseService.getBusById(busId);
      setStops(busData.stops || []);
      setShowAddForm(false);
      setNewStopForm({ locationName: '', arrivalTime: '', departureTime: '' });
      onUpdate();
    } catch (err) {
      console.error('Failed to add stop:', err);
      setError('Failed to add stop');
    } finally {
      setSaving(false);
    }
  };

  // Handle location selection from suggestions
  const handleSelectLocation = (suggestion: LocationSuggestion, isNewStop: boolean) => {
    if (isNewStop) {
      setNewStopForm({ ...newStopForm, locationName: suggestion.name });
    } else {
      setEditForm({ ...editForm, locationName: suggestion.name });
    }
    setShowSuggestions(false);
    setLocationQuery('');
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="stops-modal-overlay" onClick={onClose}>
        <div className="stops-modal">
          <div className="modal-loading">
            <div className="loading-spinner"></div>
            <p>{t('admin.stops.loading', 'Loading stops...')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stops-modal-overlay" onClick={handleBackdropClick}>
      <div className="stops-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <h3 className="modal-title">
              <MapPin size={20} />
              {t('admin.stops.title', 'Stops for Bus')} {bus?.busNumber}
            </h3>
            <p className="modal-subtitle">
              {bus?.origin} → {bus?.destination}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="modal-error">
            {error}
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {/* Content */}
        <div className="modal-content">
          {stops.length === 0 && !showAddForm ? (
            <div className="no-stops">
              <p>{t('admin.stops.noStops', 'No intermediate stops for this bus')}</p>
              <p className="hint">{t('admin.stops.addHint', 'Click "Add Stop" to add intermediate stops')}</p>
            </div>
          ) : (
            <div className="stops-list">
              {stops.map((stop, index) => (
                <div 
                  key={stop.id} 
                  className={`stop-item ${editingStopId === stop.id ? 'editing' : ''}`}
                >
                  <div className="stop-order">
                    <GripVertical size={16} className="drag-handle" />
                    <span className="order-number">{index + 1}</span>
                  </div>

                  {editingStopId === stop.id ? (
                    // Edit form
                    <div className="stop-edit-form">
                      <div className="form-row">
                        <div className="form-group location-input-group">
                          <label>{t('admin.stops.location', 'Location')}</label>
                          <input
                            type="text"
                            value={editForm.locationName}
                            onChange={(e) => {
                              setEditForm({ ...editForm, locationName: e.target.value });
                              setLocationQuery(e.target.value);
                            }}
                            placeholder={t('admin.stops.locationPlaceholder', 'Enter location name')}
                          />
                          {showSuggestions && suggestions.length > 0 && (
                            <div className="suggestions-dropdown">
                              {suggestions.map(s => (
                                <button
                                  key={s.id}
                                  className="suggestion-item"
                                  onClick={() => handleSelectLocation(s, false)}
                                >
                                  {s.name}
                                  {s.district && <span className="district">({s.district})</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="form-row timing-row">
                        <div className="form-group">
                          <label><Clock size={12} /> {t('admin.stops.arrival', 'Arrival')}</label>
                          <input
                            type="time"
                            value={editForm.arrivalTime}
                            onChange={(e) => setEditForm({ ...editForm, arrivalTime: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label><Clock size={12} /> {t('admin.stops.departure', 'Departure')}</label>
                          <input
                            type="time"
                            value={editForm.departureTime}
                            onChange={(e) => setEditForm({ ...editForm, departureTime: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="form-actions">
                        <button 
                          className="btn btn-save"
                          onClick={() => handleEditSave(stop.id)}
                          disabled={saving}
                        >
                          <Check size={14} />
                          {t('admin.stops.save', 'Save')}
                        </button>
                        <button 
                          className="btn btn-cancel"
                          onClick={handleEditCancel}
                          disabled={saving}
                        >
                          <XCircle size={14} />
                          {t('admin.stops.cancel', 'Cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <div className="stop-info">
                        <span className="stop-name">{stop.locationName || stop.name}</span>
                        <div className="stop-timing">
                          {stop.arrivalTime && (
                            <span className="timing-badge arrival">
                              <Clock size={12} /> {stop.arrivalTime}
                            </span>
                          )}
                          {stop.departureTime && (
                            <span className="timing-badge departure">
                              <Clock size={12} /> {stop.departureTime}
                            </span>
                          )}
                          {!stop.arrivalTime && !stop.departureTime && (
                            <span className="no-timing">No timing set</span>
                          )}
                        </div>
                      </div>
                      <div className="stop-actions">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEditStart(stop)}
                          title={t('admin.stops.edit', 'Edit stop')}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteStop(stop.id)}
                          title={t('admin.stops.delete', 'Delete stop')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new stop form */}
          {showAddForm && (
            <div className="add-stop-form">
              <h4>{t('admin.stops.addNew', 'Add New Stop')}</h4>
              <div className="form-row">
                <div className="form-group location-input-group">
                  <label>{t('admin.stops.location', 'Location')}</label>
                  <input
                    type="text"
                    value={newStopForm.locationName}
                    onChange={(e) => {
                      setNewStopForm({ ...newStopForm, locationName: e.target.value });
                      setLocationQuery(e.target.value);
                    }}
                    placeholder={t('admin.stops.locationPlaceholder', 'Enter location name')}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {suggestions.map(s => (
                        <button
                          key={s.id}
                          className="suggestion-item"
                          onClick={() => handleSelectLocation(s, true)}
                        >
                          {s.name}
                          {s.district && <span className="district">({s.district})</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-row timing-row">
                <div className="form-group">
                  <label><Clock size={12} /> {t('admin.stops.arrival', 'Arrival')}</label>
                  <input
                    type="time"
                    value={newStopForm.arrivalTime}
                    onChange={(e) => setNewStopForm({ ...newStopForm, arrivalTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label><Clock size={12} /> {t('admin.stops.departure', 'Departure')}</label>
                  <input
                    type="time"
                    value={newStopForm.departureTime}
                    onChange={(e) => setNewStopForm({ ...newStopForm, departureTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button 
                  className="btn btn-primary"
                  onClick={handleAddStop}
                  disabled={saving || !newStopForm.locationName.trim()}
                >
                  <Save size={14} />
                  {t('admin.stops.addStop', 'Add Stop')}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewStopForm({ locationName: '', arrivalTime: '', departureTime: '' });
                  }}
                  disabled={saving}
                >
                  {t('admin.stops.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {!showAddForm && (
            <button 
              className="btn btn-add"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} />
              {t('admin.stops.addStop', 'Add Stop')}
            </button>
          )}
          <button className="btn btn-close" onClick={onClose}>
            {t('admin.stops.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StopsModal;
