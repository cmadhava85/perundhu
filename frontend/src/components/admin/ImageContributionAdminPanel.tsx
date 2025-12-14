import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  Clock, 
  AlertCircle,
  Loader2,
  Calendar,
  User,
  RefreshCw
} from 'lucide-react';
import './ImageContributionAdminPanel.css';

interface ImageContribution {
  id: string;
  imageUrl: string;
  submissionDate: string;
  status: string; // PROCESSING, PROCESSED, MANUAL_REVIEW_NEEDED, LOW_CONFIDENCE_OCR, PROCESSING_FAILED, APPROVED, REJECTED, etc.
  userId: string;
  description?: string;
  location?: string;
  routeName?: string;
  extractedData?: string;
  validationMessage?: string;
  additionalNotes?: string;
  processedDate?: string;
}

interface OCRData {
  extractedText: string;
  busNumber?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  arrivalTime?: string;
  departureTimes?: string[];     // All departure times from backend
  arrivalTimes?: string[];       // All arrival times from backend
  stops?: Array<{
    name: string;
    arrivalTime?: string;
    departureTime?: string;
  }>;
  intermediateStops?: string[];   // Via stops as array
  confidence?: number;
  originRequired?: boolean;
  originHint?: string;
  boardFormat?: string;
  multipleRoutes?: Array<{
    routeNumber?: string;        // Bus/Route number like 166UD, 159UD
    fromLocation: string;
    toLocation: string;
    via?: string | string[];     // Can be string or array of stops
    intermediateStops?: string[]; // Via stops as array
    timings: string[];
    departureTimes?: string[];   // All departure times
    arrivalTimes?: string[];     // All arrival times
    departureTime?: string;      // Single departure time for this schedule entry
    arrivalTime?: string;        // Single arrival time for this schedule entry
    scheduleIndex?: number;      // Index within the group (1, 2, 3...)
    totalSchedules?: number;     // Total number of schedules for this route
    routeGroupId?: string;       // Identifier to group related schedules
    busType?: string;            // EXPRESS, REGULAR, SLEEPER, etc.
  }>;
  groupedRoutes?: Array<{        // Original grouped routes before expansion
    fromLocation: string;
    toLocation: string;
    via?: string;
    timings: string[];
  }>;
}

// Editable route type for manual corrections
interface EditableRoute {
  routeNumber?: string;  // Bus/Route number like 166UD, 159UD
  fromLocation: string;
  toLocation: string;
  via?: string;          // Comma-separated string for editing
  timings: string[];
  departureTime?: string;
  arrivalTime?: string;  // Added for time edit popup
  arrivalTimes?: string[]; // All arrival times
  busType?: string;      // EXPRESS, REGULAR, SLEEPER, etc.
  isEditing?: boolean;
}

export const ImageContributionAdminPanel: React.FC = () => {
  const [contributions, setContributions] = useState<ImageContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<ImageContribution | null>(null);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrData, setOcrData] = useState<OCRData | null>(null);
  const [extractingOCRId, setExtractingOCRId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'parsed' | 'raw'>('parsed');
  const [manualOrigin, setManualOrigin] = useState<string>('');
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedRoutes, setEditedRoutes] = useState<EditableRoute[]>([]);
  const [editingRouteIndex, setEditingRouteIndex] = useState<number | null>(null);
  void editingRouteIndex; // Index tracked for future edit UI features
  const [savingCorrections, setSavingCorrections] = useState(false);
  
  // Integration state
  const [integrating, setIntegrating] = useState(false);
  const [integrationResult, setIntegrationResult] = useState<{
    integratedCount: number;
    skippedDuplicates: number;
    failedCount: number;
    message: string;
  } | null>(null);
  
  // Time edit popup state for routes with missing departure/arrival times
  const [showTimeEditPopup, setShowTimeEditPopup] = useState(false);
  const [routesWithMissingTimes, setRoutesWithMissingTimes] = useState<{
    index: number;
    route: EditableRoute;
    missingDeparture: boolean;
    missingArrival: boolean;
  }[]>([]);
  const [pendingApprovalContributionId, setPendingApprovalContributionId] = useState<string | null>(null);

  useEffect(() => {
    // Monitor modal state for debugging
  }, [showOCRModal, ocrData]);

  useEffect(() => {
    let isMounted = true;

    const loadImageContributions = async () => {
      try {
        if (isMounted) {
          setLoading(true);
        }
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${API_BASE_URL}/api/admin/contributions/images`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'dev-admin-token'}`
          }
        });
        const data = await response.json();
        
        if (isMounted) {
          setContributions(data);
        }
      } catch (_error) {
        // Failed to fetch image contributions
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadImageContributions();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchImageContributions = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/api/admin/contributions/images`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'dev-admin-token'}`
        }
      });
      const data = await response.json();
      setContributions(data);
    } catch (_error) {
      // Failed to fetch image contributions
    } finally {
      setLoading(false);
    }
  };

  // Integrate all approved timing records into buses table for search
  const integrateTimingRecords = async () => {
    try {
      setIntegrating(true);
      setIntegrationResult(null);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/api/admin/integration/timing-records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'dev-admin-token'}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Integration failed: ${response.status}`);
      }
      
      const result = await response.json();
      setIntegrationResult({
        integratedCount: result.integratedCount || 0,
        skippedDuplicates: result.skippedDuplicates || 0,
        failedCount: result.failedCount || 0,
        message: result.message || 'Integration completed'
      });
      
      // Show success alert
      alert(`✅ Integration Complete!\n\n${result.message}`);
      
    } catch (error) {
      alert(`❌ Integration failed: ${error}`);
    } finally {
      setIntegrating(false);
    }
  };

  const extractOCRData = async (contribution: ImageContribution) => {
    try {
      setExtractingOCRId(contribution.id);
      setSelectedContribution(contribution);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const url = `${API_BASE_URL}/api/admin/contributions/images/${contribution.id}/extract-ocr`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'dev-admin-token'}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Map backend field names to frontend field names
      // Backend returns 'routes' but frontend expects 'multipleRoutes'
      const routes = data.multipleRoutes || data.routes || [];
      
      // Map each route to include all timing fields
      const mappedRoutes = routes.map((route: Record<string, unknown>) => ({
        routeNumber: route.routeNumber,
        fromLocation: route.fromLocation || data.origin || data.fromLocation,
        toLocation: route.toLocation || route.destination,
        via: route.via || route.intermediateStops,
        intermediateStops: route.intermediateStops || (Array.isArray(route.via) ? route.via : undefined),
        timings: route.timings || route.departureTimes || [],
        departureTimes: route.departureTimes || route.timings || [],
        arrivalTimes: route.arrivalTimes || [],
        departureTime: route.departureTime || (route.departureTimes as string[])?.[0] || (route.timings as string[])?.[0],
        arrivalTime: route.arrivalTime || (route.arrivalTimes as string[])?.[0],
        busType: route.busType,
        scheduleIndex: route.scheduleIndex,
        totalSchedules: route.totalSchedules,
        routeGroupId: route.routeGroupId
      }));
      
      const mappedData = {
        extractedText: data.extractedText || '',
        busNumber: data.busNumber || data.routeNumber,
        origin: data.origin || data.fromLocation,
        destination: data.destination || data.toLocation,
        departureTime: data.departureTime || data.departureTimes?.[0],
        arrivalTime: data.arrivalTime || data.arrivalTimes?.[0],
        departureTimes: data.departureTimes || data.allDepartureTimes || [],
        arrivalTimes: data.arrivalTimes || [],
        confidence: data.confidence,
        stops: data.stops || [],
        intermediateStops: data.intermediateStops || [],
        originRequired: data.originRequired || false,
        originHint: data.originHint,
        boardFormat: data.boardFormat || data.boardType,
        multipleRoutes: mappedRoutes
      };
      
      setOcrData(mappedData);
      setManualOrigin(''); // Reset manual origin when loading new OCR data
      setIsEditMode(false); // Reset edit mode
      setEditedRoutes([]); // Clear any previous edits
      setShowOCRModal(true);
    } catch (error) {
      alert('Failed to extract text from image. Please try again. Error: ' + error);
    } finally {
      setExtractingOCRId(null);
    }
  };

  // Enter edit mode with current routes
  const enterEditMode = () => {
    if (ocrData?.multipleRoutes) {
      setEditedRoutes(ocrData.multipleRoutes.map(route => ({
        routeNumber: route.routeNumber || '',
        fromLocation: route.fromLocation || ocrData.origin || '',
        toLocation: route.toLocation,
        via: Array.isArray(route.via) ? route.via.join(', ') : route.via,
        timings: route.timings || [],
        departureTime: route.departureTime,
        arrivalTime: route.arrivalTime,
        arrivalTimes: route.arrivalTimes || [],
        busType: route.busType,
        isEditing: false
      })));
      setIsEditMode(true);
    }
  };

  // Update a specific route field
  const updateRoute = (index: number, field: keyof EditableRoute, value: string | string[]) => {
    setEditedRoutes(prev => prev.map((route, i) => 
      i === index ? { ...route, [field]: value } : route
    ));
  };

  // Delete a route
  const deleteRoute = (index: number) => {
    setEditedRoutes(prev => prev.filter((_, i) => i !== index));
  };

  // Add a new route
  const addNewRoute = () => {
    setEditedRoutes(prev => [...prev, {
      routeNumber: '',
      fromLocation: ocrData?.origin || manualOrigin || '',
      toLocation: '',
      via: '',
      timings: [],
      departureTime: '',
      isEditing: true
    }]);
    setEditingRouteIndex(editedRoutes.length);
  };

  // Save corrections and apply to OCR data
  const saveCorrections = async () => {
    if (!selectedContribution || !ocrData) return;
    
    setSavingCorrections(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      
      // Create corrected OCR data
      const correctedData = {
        ...ocrData,
        origin: manualOrigin || ocrData.origin,
        multipleRoutes: editedRoutes.map((route, index) => ({
          routeNumber: route.routeNumber || undefined,
          fromLocation: route.fromLocation,
          toLocation: route.toLocation,
          via: route.via,
          timings: route.timings,
          departureTime: route.departureTime || (route.timings.length > 0 ? route.timings[0] : undefined),
          scheduleIndex: index + 1,
          totalSchedules: editedRoutes.length
        }))
      };

      // Save to backend
      const response = await fetch(
        `${API_BASE_URL}/api/admin/contributions/images/${selectedContribution.id}/update-extracted-data`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || 'dev-admin-token'}`
          },
          body: JSON.stringify(correctedData)
        }
      );

      if (response.ok) {
        // Update local state
        setOcrData(correctedData as OCRData);
        setIsEditMode(false);
        alert('Corrections saved successfully! You can now approve or reject the contribution.');
      } else {
        throw new Error('Failed to save corrections');
      }
    } catch (_error) {
      alert('Failed to save corrections. Please try again.');
    } finally {
      setSavingCorrections(false);
    }
  };

  // Cancel edit mode
  const cancelEditMode = () => {
    setIsEditMode(false);
    setEditedRoutes([]);
    setEditingRouteIndex(null);
  };

  // Check if any routes have missing departure or arrival times
  const checkRoutesForMissingTimes = (): { index: number; route: EditableRoute; missingDeparture: boolean; missingArrival: boolean; }[] => {
    const routesToCheck = isEditMode ? editedRoutes : (ocrData?.multipleRoutes || []).map(r => ({
      routeNumber: r.routeNumber,
      fromLocation: r.fromLocation,
      toLocation: r.toLocation,
      via: Array.isArray(r.via) ? r.via.join(', ') : r.via,
      timings: r.timings,
      departureTime: r.departureTime,
      arrivalTime: r.arrivalTime,
      arrivalTimes: r.arrivalTimes || [],
      busType: r.busType,
    }));
    
    const routesWithIssues: { index: number; route: EditableRoute; missingDeparture: boolean; missingArrival: boolean; }[] = [];
    
    routesToCheck.forEach((route, index) => {
      const hasDeparture = route.departureTime || (route.timings && route.timings.length > 0);
      // For arrival time, we consider it missing if not explicitly set
      // Note: Backend will estimate or leave null, but we want admin to have the option to set it
      
      if (!hasDeparture) {
        routesWithIssues.push({
          index,
          route,
          missingDeparture: true,
          missingArrival: true // If departure is missing, arrival definitely is too
        });
      }
    });
    
    return routesWithIssues;
  };

  // Handle approval with validation
  const handleApproveWithRoutes = (contributionId: string) => {
    // Check for routes with missing times
    const routesWithIssues = checkRoutesForMissingTimes();
    
    if (routesWithIssues.length > 0) {
      // Show the time edit popup
      setRoutesWithMissingTimes(routesWithIssues);
      setPendingApprovalContributionId(contributionId);
      setShowTimeEditPopup(true);
    } else {
      // All routes have required times, proceed with approval
      setShowOCRModal(false);
      approveContribution(contributionId, true);
    }
  };

  // Update time for a route in the popup
  const updateRouteTimeInPopup = (index: number, field: 'departureTime' | 'arrivalTime', value: string) => {
    setRoutesWithMissingTimes(prev => prev.map(item => 
      item.index === index 
        ? { ...item, route: { ...item.route, [field]: value } }
        : item
    ));
  };

  // Save times from popup and continue with approval
  const saveTimesAndApprove = async () => {
    if (!pendingApprovalContributionId || !selectedContribution || !ocrData) return;
    
    // Update the OCR data with the corrected times
    const updatedRoutes = [...(ocrData.multipleRoutes || [])];
    routesWithMissingTimes.forEach(item => {
      if (updatedRoutes[item.index]) {
        updatedRoutes[item.index] = {
          ...updatedRoutes[item.index],
          departureTime: item.route.departureTime,
          // Add arrival time if it was set
          ...(item.route.arrivalTime ? { arrivalTime: item.route.arrivalTime } : {})
        } as typeof updatedRoutes[0];
        
        // Also update timings array if departure time was set
        if (item.route.departureTime && (!updatedRoutes[item.index].timings || updatedRoutes[item.index].timings.length === 0)) {
          updatedRoutes[item.index].timings = [item.route.departureTime];
        }
      }
    });

    // Save the corrected data to backend first
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const correctedData = {
        ...ocrData,
        multipleRoutes: updatedRoutes
      };

      const response = await fetch(
        `${API_BASE_URL}/api/admin/contributions/images/${selectedContribution.id}/update-extracted-data`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || 'dev-admin-token'}`
          },
          body: JSON.stringify(correctedData)
        }
      );

      if (response.ok) {
        // Update local state
        setOcrData(correctedData as OCRData);
        
        // Close popups and proceed with approval
        setShowTimeEditPopup(false);
        setRoutesWithMissingTimes([]);
        setShowOCRModal(false);
        
        // Now approve with updated data
        await approveContribution(pendingApprovalContributionId, true);
      } else {
        throw new Error('Failed to save corrected times');
      }
    } catch (error) {
      alert('Failed to save times: ' + error);
    } finally {
      setPendingApprovalContributionId(null);
    }
  };

  // Skip routes with missing times (don't integrate them)
  const skipRoutesWithMissingTimes = async () => {
    if (!pendingApprovalContributionId || !selectedContribution || !ocrData) return;
    
    // Remove routes with missing departure times from the data
    const validRoutes = (ocrData.multipleRoutes || []).filter((_, index) => 
      !routesWithMissingTimes.some(item => item.index === index)
    );
    
    if (validRoutes.length === 0) {
      alert('No routes with valid departure times. Please edit at least one route with a departure time.');
      return;
    }
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const correctedData = {
        ...ocrData,
        multipleRoutes: validRoutes
      };

      const response = await fetch(
        `${API_BASE_URL}/api/admin/contributions/images/${selectedContribution.id}/update-extracted-data`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || 'dev-admin-token'}`
          },
          body: JSON.stringify(correctedData)
        }
      );

      if (response.ok) {
        setOcrData(correctedData as OCRData);
        setShowTimeEditPopup(false);
        setRoutesWithMissingTimes([]);
        setShowOCRModal(false);
        
        await approveContribution(pendingApprovalContributionId, true);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      alert('Failed: ' + error);
    } finally {
      setPendingApprovalContributionId(null);
    }
  };

  const approveContribution = async (contributionId: string, createRoute: boolean = false) => {
    try {
      setProcessingId(contributionId);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/api/admin/contributions/images/${contributionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'dev-admin-token'}`
        },
        body: JSON.stringify({ extractOCRData: createRoute }),
      });

      if (response.ok) {
        const result = await response.json();
        await fetchImageContributions();
        
        if (createRoute && result.routeCreated) {
          alert(`Contribution approved successfully! Route data has been created and is now available in the search route screen.`);
        } else {
          alert('Contribution approved successfully!');
        }
        
        setShowOCRModal(false);
        setOcrData(null);
      } else {
        throw new Error('Failed to approve contribution');
      }
    } catch (_error) {
      alert('Failed to approve contribution. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectContribution = async (contributionId: string, reason?: string) => {
    try {
      setProcessingId(contributionId);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/api/admin/contributions/images/${contributionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'dev-admin-token'}`
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        await fetchImageContributions();
        alert('Contribution rejected successfully!');
        setShowOCRModal(false);
        setOcrData(null);
      } else {
        throw new Error('Failed to reject contribution');
      }
    } catch (_error) {
      alert('Failed to reject contribution. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSING': return 'text-blue-600 bg-blue-100';
      case 'PROCESSED': return 'text-green-600 bg-green-100';
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'MANUAL_REVIEW_NEEDED': return 'text-yellow-600 bg-yellow-100';
      case 'LOW_CONFIDENCE_OCR': return 'text-orange-600 bg-orange-100';
      case 'PROCESSING_FAILED': return 'text-red-600 bg-red-100';
      case 'UPLOAD_FAILED': return 'text-red-600 bg-red-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSING': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'PROCESSED': return <CheckCircle className="w-4 h-4" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'MANUAL_REVIEW_NEEDED': return <Clock className="w-4 h-4" />;
      case 'LOW_CONFIDENCE_OCR': return <AlertCircle className="w-4 h-4" />;
      case 'PROCESSING_FAILED': return <XCircle className="w-4 h-4" />;
      case 'UPLOAD_FAILED': return <XCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading image contributions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Image Contributions</h2>
        
        {/* Integration Button */}
        <button
          onClick={integrateTimingRecords}
          disabled={integrating}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          title="Integrate approved timing records into the buses table so they appear in search results"
        >
          {integrating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Integrating...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Integrate to Search
            </>
          )}
        </button>
      </div>
      
      {/* Integration Result Banner */}
      {integrationResult && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-800">Integration Complete</h4>
              <p className="text-green-700 text-sm mt-1">{integrationResult.message}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-green-700">
                  <span className="font-bold">{integrationResult.integratedCount}</span> new buses added
                </span>
                <span className="text-blue-700">
                  <span className="font-bold">{integrationResult.skippedDuplicates}</span> duplicates linked
                </span>
                {integrationResult.failedCount > 0 && (
                  <span className="text-red-700">
                    <span className="font-bold">{integrationResult.failedCount}</span> failed
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setIntegrationResult(null)}
              className="ml-auto text-green-600 hover:text-green-800"
              title="Dismiss"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Statistics Table */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="px-8 py-4 text-center text-sm font-bold text-gray-800 bg-gradient-to-br from-blue-50 to-blue-100 uppercase tracking-wider">Total</th>
              <th className="px-8 py-4 text-center text-sm font-bold text-gray-800 bg-gradient-to-br from-indigo-50 to-indigo-100 border-l-2 border-gray-200 uppercase tracking-wider">Processing</th>
              <th className="px-8 py-4 text-center text-sm font-bold text-gray-800 bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-2 border-gray-200 uppercase tracking-wider">Needs Review</th>
              <th className="px-8 py-4 text-center text-sm font-bold text-gray-800 bg-gradient-to-br from-green-50 to-green-100 border-l-2 border-gray-200 uppercase tracking-wider">Approved</th>
              <th className="px-8 py-4 text-center text-sm font-bold text-gray-800 bg-gradient-to-br from-red-50 to-red-100 border-l-2 border-gray-200 uppercase tracking-wider">Failed</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-8 py-6 text-center text-3xl font-extrabold text-blue-700 bg-blue-50">{contributions.length}</td>
              <td className="px-8 py-6 text-center text-3xl font-extrabold text-indigo-700 bg-indigo-50 border-l-2 border-gray-200">{contributions.filter(c => c.status === 'PROCESSING').length}</td>
              <td className="px-8 py-6 text-center text-3xl font-extrabold text-yellow-700 bg-yellow-50 border-l-2 border-gray-200">{contributions.filter(c => c.status === 'MANUAL_REVIEW_NEEDED' || c.status === 'LOW_CONFIDENCE_OCR').length}</td>
              <td className="px-8 py-6 text-center text-3xl font-extrabold text-green-700 bg-green-50 border-l-2 border-gray-200">{contributions.filter(c => c.status === 'APPROVED' || c.status === 'PROCESSED').length}</td>
              <td className="px-8 py-6 text-center text-3xl font-extrabold text-red-700 bg-red-50 border-l-2 border-gray-200">{contributions.filter(c => c.status === 'PROCESSING_FAILED' || c.status === 'UPLOAD_FAILED' || c.status === 'REJECTED').length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Contributions Table */}
      <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 overflow-hidden">
        {contributions.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No image contributions found</h3>
            <p className="text-gray-500">Image contributions will appear here when users submit them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-gray-300">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    Image
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    Contribution ID
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    Submitted By
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    Submission Date
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contributions.map((contribution) => (
                  <tr key={contribution.id} className="hover:bg-blue-50 transition-all duration-150 border-b border-gray-200">
                    {/* Image Thumbnail */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        type="button"
                        onClick={() => window.open(contribution.imageUrl, '_blank')}
                        className="relative group cursor-pointer"
                        aria-label="View full image"
                      >
                        <img 
                          src={contribution.imageUrl} 
                          alt="Bus schedule"
                          className="h-20 w-20 object-cover rounded-lg border-2 border-gray-300 group-hover:border-blue-500 group-hover:shadow-lg transition-all duration-200 shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    </td>
                    
                    {/* Contribution ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{contribution.id.slice(-8)}</div>
                      <div className="text-xs text-gray-500">{contribution.id}</div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${getStatusColor(contribution.status)}`}>
                        {getStatusIcon(contribution.status)}
                        <span className="ml-2">{contribution.status.split('_').join(' ')}</span>
                      </span>
                    </td>
                    
                    {/* Submitted By */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{contribution.userId}</span>
                      </div>
                    </td>
                    
                    {/* Submission Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {new Date(contribution.submissionDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(contribution.imageUrl, '_blank')}
                          className="inline-flex items-center p-2 border-2 border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 transition-all duration-150 shadow-sm hover:shadow"
                          title="View Full Image"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => extractOCRData(contribution)}
                          disabled={extractingOCRId === contribution.id}
                          className="inline-flex items-center p-2 border-2 border-blue-400 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm hover:shadow"
                          title="Extract Text"
                        >
                          {extractingOCRId === contribution.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Download className="w-5 h-5" />
                          )}
                        </button>
                        
                        {(contribution.status === 'PROCESSING' || contribution.status === 'MANUAL_REVIEW_NEEDED' || contribution.status === 'LOW_CONFIDENCE_OCR') && (
                          <>
                            <button
                              onClick={() => approveContribution(contribution.id, false)}
                              disabled={processingId === contribution.id}
                              className="inline-flex items-center p-2 border-2 border-green-500 rounded-lg text-white bg-green-600 hover:bg-green-700 hover:border-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm hover:shadow"
                              title="Approve"
                            >
                              {processingId === contribution.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-5 h-5" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => rejectContribution(contribution.id)}
                              disabled={processingId === contribution.id}
                              className="inline-flex items-center p-2 border-2 border-red-500 rounded-lg text-white bg-red-600 hover:bg-red-700 hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm hover:shadow"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OCR Data Modal - Redesigned with Mobile Support */}
      {showOCRModal && ocrData && (
        <div 
          className="ocr-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ocr-modal-title"
          onClick={() => setShowOCRModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowOCRModal(false)}
        >
          <div 
            className="ocr-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="ocr-modal-header">
              <div className="ocr-modal-header-content">
                <div className="ocr-modal-icon">
                  <svg style={{ width: '24px', height: '24px' }} className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 id="ocr-modal-title" className="ocr-modal-title">OCR Extracted Data</h3>
                  <p className="ocr-modal-subtitle">Bus Schedule Information</p>
                </div>
              </div>
              <button
                onClick={() => setShowOCRModal(false)}
                className="ocr-modal-close-btn"
                title="Close"
              >
                <XCircle style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="ocr-modal-tabs">
              <button
                onClick={() => setActiveTab('parsed')}
                className={`ocr-modal-tab ${activeTab === 'parsed' ? 'active' : ''}`}
              >
                <span className="ocr-modal-tab-content">
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="tab-text">Parsed Data</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`ocr-modal-tab ${activeTab === 'raw' ? 'active' : ''}`}
              >
                <span className="ocr-modal-tab-content">
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="tab-text">Raw Text</span>
                </span>
              </button>
            </div>

            {/* Content Area - Scrollable */}
            <div className="ocr-modal-content">
              {activeTab === 'parsed' ? (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="ocr-stats-grid">
                    <div className="ocr-stat-card route">
                      <div className="ocr-stat-label">Route</div>
                      <div className="ocr-stat-value">{ocrData.busNumber || 'N/A'}</div>
                    </div>
                    <div className="ocr-stat-card departure">
                      <div className="ocr-stat-label">Departure</div>
                      <div className="ocr-stat-value">{ocrData.departureTime || 'N/A'}</div>
                    </div>
                    <div className="ocr-stat-card confidence">
                      <div className="ocr-stat-label">Confidence</div>
                      <div className="ocr-stat-value">{ocrData.confidence ? `${Math.round(ocrData.confidence * 100)}%` : 'N/A'}</div>
                    </div>
                  </div>

                  {/* Manual Origin Input - shown when origin could not be detected */}
                  {ocrData.originRequired && !ocrData.origin && (
                    <div className="bg-amber-50 rounded-lg border-2 border-amber-300 shadow-sm overflow-hidden">
                      <div style={{ background: 'linear-gradient(to right, #fef3c7, #fde68a)' }} className="px-4 py-3 border-b border-amber-300">
                        <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                          <AlertCircle style={{ width: '20px', height: '20px', color: '#d97706' }} />
                          Origin Station Required
                        </h4>
                      </div>
                      <div className="p-4 space-y-3">
                        <p className="text-sm text-amber-700">
                          {ocrData.originHint || 'The origin station could not be detected from the image. Please enter it manually.'}
                        </p>
                        {ocrData.boardFormat === 'DESTINATION_VIA_TIME' && (
                          <p className="text-xs text-amber-600 italic">
                            ℹ️ This appears to be a bus station timing board showing departures to various destinations.
                          </p>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={manualOrigin}
                            onChange={(e) => setManualOrigin(e.target.value)}
                            placeholder="Enter origin station (e.g., Rameshwaram)"
                            className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                          />
                          <button
                            onClick={() => {
                              if (manualOrigin.trim()) {
                                setOcrData(prev => prev ? {
                                  ...prev,
                                  origin: manualOrigin.trim().toUpperCase(),
                                  originRequired: false,
                                  // Update all routes with the manual origin
                                  multipleRoutes: prev.multipleRoutes?.map(route => ({
                                    ...route,
                                    fromLocation: manualOrigin.trim().toUpperCase()
                                  }))
                                } : null);
                              }
                            }}
                            disabled={!manualOrigin.trim()}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                          >
                            Set Origin
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs text-gray-500">Quick select:</span>
                          {['RAMESHWARAM', 'CHENNAI', 'MADURAI', 'COIMBATORE', 'TRICHY'].map(city => (
                            <button
                              key={city}
                              onClick={() => setManualOrigin(city)}
                              className="px-2 py-1 text-xs bg-white border border-amber-300 rounded hover:bg-amber-100 transition-colors"
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multiple Routes Section - View or Edit Mode */}
                  {(ocrData.multipleRoutes && ocrData.multipleRoutes.length > 0) || isEditMode ? (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <div style={{ background: isEditMode ? 'linear-gradient(to right, #fef3c7, #fde68a)' : 'linear-gradient(to right, #dbeafe, #bfdbfe)' }} className="px-4 py-3 border-b border-blue-200 flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <svg style={{ width: '20px', height: '20px', color: isEditMode ? '#d97706' : '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          {isEditMode ? `Editing Routes (${editedRoutes.length})` : `Detected Routes (${ocrData.multipleRoutes?.length || 0})`}
                        </h4>
                        {isEditMode && (
                          <button
                            onClick={addNewRoute}
                            className="px-3 py-1 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-1"
                          >
                            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Route
                          </button>
                        )}
                      </div>
                      <div className="p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-3">
                          {/* VIEW MODE */}
                          {!isEditMode && ocrData.multipleRoutes?.map((route, index) => (
                            <div key={`${route.fromLocation}-${route.toLocation}-${route.departureTime || index}`} className="p-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors" style={{ backgroundColor: '#f0f9ff' }}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}>
                                  <span className="text-white font-bold text-xs">{index + 1}</span>
                                </div>
                                {route.routeNumber && (
                                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded font-bold border border-purple-300">
                                    {route.routeNumber}
                                  </span>
                                )}
                                {route.busType && (
                                  <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded font-bold border border-indigo-300">
                                    {route.busType}
                                  </span>
                                )}
                                <div className="flex-1 font-semibold text-gray-900 text-sm flex items-center gap-2">
                                  <span>{route.fromLocation || ocrData.origin || '?'}</span>
                                  <span className="text-blue-500">→</span>
                                  <span>{route.toLocation}</span>
                                </div>
                                {route.timings && route.timings.length > 0 ? (
                                  <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg font-bold border border-green-300">
                                    🕐 {route.timings.length} time{route.timings.length > 1 ? 's' : ''}
                                  </span>
                                ) : route.departureTime && (
                                  <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg font-bold border border-green-300">
                                    🕐 {route.departureTime}
                                  </span>
                                )}
                              </div>
                              {route.via && (
                                <div className="text-xs text-gray-600 ml-8 mb-1">
                                  via <span className="font-medium">{Array.isArray(route.via) ? route.via.join(', ') : route.via}</span>
                                </div>
                              )}
                              {/* Show departure and arrival times */}
                              <div className="ml-8 mt-2 space-y-2">
                                {/* Departure Times */}
                                {(route.timings && route.timings.length > 0) || (route.departureTimes && route.departureTimes.length > 0) ? (
                                  <div>
                                    <div className="text-xs text-gray-600 mb-1 font-medium">🚌 Departure ({(route.timings || route.departureTimes || []).length}):</div>
                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                      {(route.timings || route.departureTimes || []).map((time) => (
                                        <span key={`dep-${route.toLocation}-${time}`} className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded border border-green-200">
                                          {time}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                                {/* Arrival Times */}
                                {route.arrivalTimes && route.arrivalTimes.length > 0 && (
                                  <div>
                                    <div className="text-xs text-gray-600 mb-1 font-medium">🏁 Arrival ({route.arrivalTimes.length}):</div>
                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                      {route.arrivalTimes.map((time) => (
                                        <span key={`arr-${route.toLocation}-${time}`} className="px-2 py-0.5 text-xs bg-orange-50 text-orange-700 rounded border border-orange-200">
                                          {time}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Single arrival time if no array */}
                                {!route.arrivalTimes?.length && route.arrivalTime && (
                                  <div className="text-xs text-gray-600">
                                    🏁 Arrival: <span className="font-medium text-orange-700">{route.arrivalTime}</span>
                                  </div>
                                )}
                              </div>
                              {route.totalSchedules && route.totalSchedules > 1 && (
                                <div className="text-xs text-blue-600 ml-8 mt-1">
                                  Schedule {route.scheduleIndex} of {route.totalSchedules} for this route
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {/* EDIT MODE */}
                          {isEditMode && editedRoutes.map((route, index) => (
                            <div key={`edit-${route.fromLocation}-${route.toLocation}-${index}`} className="p-4 rounded-lg border-2 border-amber-300 bg-amber-50">
                              <div className="flex items-start gap-2 mb-3">
                                <div className="rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 bg-amber-600">
                                  <span className="text-white font-bold text-xs">{index + 1}</span>
                                </div>
                                <div className="flex-1 space-y-3">
                                  {/* Route Number Row */}
                                  <div className="flex gap-2 items-center">
                                    <div className="w-32">
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Route No.</label>
                                      <input
                                        type="text"
                                        value={route.routeNumber || ''}
                                        onChange={(e) => updateRoute(index, 'routeNumber', e.target.value.toUpperCase())}
                                        className="w-full px-2 py-1.5 text-sm border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="e.g., 166UD"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* From/To Row */}
                                  <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                      <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                                      <input
                                        type="text"
                                        value={route.fromLocation}
                                        onChange={(e) => updateRoute(index, 'fromLocation', e.target.value.toUpperCase())}
                                        className="w-full px-2 py-1.5 text-sm border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="Origin city"
                                      />
                                    </div>
                                    <span className="text-amber-600 font-bold mt-5">→</span>
                                    <div className="flex-1">
                                      <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                                      <input
                                        type="text"
                                        value={route.toLocation}
                                        onChange={(e) => updateRoute(index, 'toLocation', e.target.value.toUpperCase())}
                                        className="w-full px-2 py-1.5 text-sm border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="Destination city"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Via Row */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Via (comma-separated stops)</label>
                                    <input
                                      type="text"
                                      value={route.via || ''}
                                      onChange={(e) => updateRoute(index, 'via', e.target.value.toUpperCase())}
                                      className="w-full px-2 py-1.5 text-sm border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                      placeholder="e.g., MADURAI, TRICHY, SALEM"
                                    />
                                  </div>
                                  
                                  {/* Timings Row - Editable list of all departure times */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Departure Times ({route.timings?.length || 0})
                                      <span className="text-gray-400 ml-2">- comma separated</span>
                                    </label>
                                    <div className="space-y-2">
                                      <textarea
                                        value={(route.timings || []).join(', ')}
                                        onChange={(e) => {
                                          const timingsStr = e.target.value;
                                          const timingsArray = timingsStr
                                            .split(/[,\n]/)
                                            .map(t => t.trim())
                                            .filter(t => t.length > 0);
                                          updateRoute(index, 'timings', timingsArray);
                                          // Also update departureTime to first timing
                                          if (timingsArray.length > 0) {
                                            updateRoute(index, 'departureTime', timingsArray[0]);
                                          }
                                        }}
                                        className="w-full px-2 py-1.5 text-sm border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-h-[60px] resize-y"
                                        placeholder="e.g., 06:00, 08:30, 10:15, 14:00, 18:30"
                                        rows={2}
                                      />
                                      {/* Display individual time chips for easy editing */}
                                      {route.timings && route.timings.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                          {route.timings.map((time, timeIdx) => (
                                            <span 
                                              key={`time-${index}-${timeIdx}`} 
                                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded border border-blue-200 flex items-center gap-1"
                                            >
                                              🕐 {time}
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  const newTimings = route.timings.filter((_, idx) => idx !== timeIdx);
                                                  updateRoute(index, 'timings', newTimings);
                                                  if (newTimings.length > 0 && timeIdx === 0) {
                                                    updateRoute(index, 'departureTime', newTimings[0]);
                                                  }
                                                }}
                                                className="ml-1 text-red-500 hover:text-red-700 font-bold"
                                                title="Remove this time"
                                              >
                                                ×
                                              </button>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {/* Quick add time button */}
                                      <div className="flex gap-2 items-center">
                                        <input
                                          type="text"
                                          id={`add-time-${index}`}
                                          className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                          placeholder="HH:MM"
                                        />
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            const input = document.getElementById(`add-time-${index}`) as HTMLInputElement;
                                            const newTime = input.value.trim();
                                            if (newTime) {
                                              const newTimings = [...(route.timings || []), newTime];
                                              updateRoute(index, 'timings', newTimings);
                                              if (newTimings.length === 1) {
                                                updateRoute(index, 'departureTime', newTime);
                                              }
                                              input.value = '';
                                            }
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                                        >
                                          <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                          </svg>
                                          Add Time
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Delete button */}
                                <button
                                  onClick={() => deleteRoute(index)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                                  title="Delete route"
                                >
                                  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          {isEditMode && editedRoutes.length === 0 && (
                            <div className="text-center py-6 text-gray-500">
                              <p>No routes. Click "Add Route" to add one manually.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Route Details */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div style={{ background: 'linear-gradient(to right, #f3f4f6, #f9fafb)' }} className="px-4 py-3 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <svg style={{ width: '20px', height: '20px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Route Information
                      </h4>
                    </div>
                    <div className="p-4 space-y-3">
                      {ocrData.busNumber && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-lg">🚌</span> Bus Number
                          </span>
                          <span className="font-semibold text-gray-900">{ocrData.busNumber}</span>
                        </div>
                      )}
                      {ocrData.origin && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-lg">📍</span> Origin
                          </span>
                          <span className="font-semibold text-gray-900">{ocrData.origin}</span>
                        </div>
                      )}
                      {ocrData.destination && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-lg">🎯</span> Destination
                          </span>
                          <span className="font-semibold text-gray-900">{ocrData.destination}</span>
                        </div>
                      )}
                      {ocrData.departureTime && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-lg">🕐</span> Departure
                          </span>
                          <span className="font-semibold text-blue-700">{ocrData.departureTime}</span>
                        </div>
                      )}
                      {ocrData.arrivalTime && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-lg">🕓</span> Arrival
                          </span>
                          <span className="font-semibold text-blue-700">{ocrData.arrivalTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stops */}
                  {ocrData.stops && ocrData.stops.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <div style={{ background: 'linear-gradient(to right, #fed7aa, #ffedd5)' }} className="px-4 py-3 border-b border-orange-200">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <svg style={{ width: '20px', height: '20px', color: '#ea580c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Intermediate Stops ({ocrData.stops.length})
                        </h4>
                      </div>
                      <div className="p-4 max-h-60 overflow-y-auto">
                        <div className="space-y-2">
                          {ocrData.stops.map((stop, index) => (
                            <div key={stop.name + index} className="flex items-start gap-3 p-3 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors" style={{ backgroundColor: '#fff7ed' }}>
                              <div className="rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f97316' }}>
                                <span className="text-white font-bold text-xs">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 text-sm">{stop.name}</div>
                                <div className="text-xs text-gray-600 mt-1 flex gap-3">
                                  {stop.arrivalTime && <span>↓ {stop.arrivalTime}</span>}
                                  {stop.departureTime && <span>↑ {stop.departureTime}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div style={{ background: 'linear-gradient(to right, #f3f4f6, #f9fafb)' }} className="px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-800">Raw Extracted Text</h4>
                  </div>
                  <div className="p-4">
                    <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                      {ocrData.extractedText}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="ocr-modal-footer">
              <div className="ocr-modal-footer-actions">
                {/* Left side - Edit button */}
                <div className="ocr-footer-left">
                  {!isEditMode ? (
                    <button
                      onClick={enterEditMode}
                      className="ocr-btn ocr-btn-edit"
                      disabled={!ocrData?.multipleRoutes?.length}
                      title="Manually correct OCR errors"
                    >
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="btn-text">Edit Routes</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={cancelEditMode}
                        className="ocr-btn ocr-btn-cancel-edit"
                      >
                        <span className="btn-text">Cancel Edit</span>
                      </button>
                      <button
                        onClick={saveCorrections}
                        disabled={savingCorrections}
                        className="ocr-btn ocr-btn-save"
                      >
                        {savingCorrections ? (
                          <>
                            <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                            <span className="btn-text">Saving...</span>
                          </>
                        ) : (
                          <>
                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="btn-text">Save Corrections</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
                
                {/* Right side - Approve/Reject buttons */}
                <div className="ocr-footer-right">
                <button
                  onClick={() => setShowOCRModal(false)}
                  className="ocr-btn ocr-btn-cancel"
                >
                  <span className="btn-text">Cancel</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedContribution) {
                      setShowOCRModal(false);
                      rejectContribution(selectedContribution.id);
                    }
                  }}
                  className="ocr-btn ocr-btn-reject"
                  disabled={processingId !== null || isEditMode}
                >
                  <XCircle style={{ width: '16px', height: '16px' }} />
                  <span className="btn-text">Reject</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedContribution) {
                      setShowOCRModal(false);
                      approveContribution(selectedContribution.id, false);
                    }
                  }}
                  className="ocr-btn ocr-btn-approve"
                  disabled={processingId !== null || isEditMode}
                >
                  <CheckCircle style={{ width: '16px', height: '16px' }} />
                  <span className="btn-text">Approve</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedContribution) {
                      handleApproveWithRoutes(selectedContribution.id);
                    }
                  }}
                  className="ocr-btn ocr-btn-approve-routes"
                  disabled={processingId !== null || isEditMode}
                >
                  {processingId ? (
                    <>
                      <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                      <span className="btn-text">Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle style={{ width: '16px', height: '16px' }} />
                      <span className="btn-text">Approve & Create Routes</span>
                    </>
                  )}
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Edit Popup - shown when routes have missing departure/arrival times */}
      {showTimeEditPopup && routesWithMissingTimes.length > 0 && (
        <div 
          className="time-edit-popup-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="time-edit-popup-title"
          onClick={() => {
            setShowTimeEditPopup(false);
            setRoutesWithMissingTimes([]);
            setPendingApprovalContributionId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowTimeEditPopup(false);
              setRoutesWithMissingTimes([]);
              setPendingApprovalContributionId(null);
            }
          }}
        >
          <div 
            className="time-edit-popup"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="time-edit-popup-header">
              <div className="time-edit-popup-header-content">
                <div className="time-edit-popup-icon">
                  <AlertCircle style={{ width: '24px', height: '24px' }} className="text-white" />
                </div>
                <div>
                  <h3 id="time-edit-popup-title" className="time-edit-popup-title">Missing Time Information</h3>
                  <p className="time-edit-popup-subtitle">{routesWithMissingTimes.length} route(s) need departure time</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTimeEditPopup(false);
                  setRoutesWithMissingTimes([]);
                  setPendingApprovalContributionId(null);
                }}
                className="time-edit-popup-close"
                title="Close"
              >
                <XCircle style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            {/* Info Banner */}
            <div className="time-edit-popup-info">
              <p>
                ⚠️ The following routes are missing departure time. Please enter the departure time to integrate them, 
                or skip these routes to integrate only the valid ones.
              </p>
            </div>

            {/* Routes List */}
            <div className="time-edit-popup-content">
              {routesWithMissingTimes.map((item) => (
                <div key={item.index} className="time-edit-route-card">
                  <div className="time-edit-route-header">
                    <div className="time-edit-route-badge">
                      <span>{item.index + 1}</span>
                    </div>
                    <div className="time-edit-route-name">
                      {item.route.fromLocation || '?'} → {item.route.toLocation || '?'}
                    </div>
                    {item.route.routeNumber && (
                      <span className="time-edit-route-number">
                        {item.route.routeNumber}
                      </span>
                    )}
                  </div>
                  
                  <div className="time-edit-inputs">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departure Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.route.departureTime || ''}
                        onChange={(e) => updateRouteTimeInPopup(item.index, 'departureTime', e.target.value)}
                        placeholder="e.g., 08:30 or 14:45"
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                          item.missingDeparture && !item.route.departureTime 
                            ? 'border-red-400 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                      />
                      {item.missingDeparture && !item.route.departureTime && (
                        <p className="text-xs text-red-600 mt-1">Departure time is required</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Arrival Time <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={(item.route as EditableRoute & { arrivalTime?: string }).arrivalTime || ''}
                        onChange={(e) => updateRouteTimeInPopup(item.index, 'arrivalTime', e.target.value)}
                        placeholder="e.g., 12:00 or 18:30"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Will be estimated if not provided</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={skipRoutesWithMissingTimes}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-all"
                >
                  Skip These Routes
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowTimeEditPopup(false);
                      setRoutesWithMissingTimes([]);
                      setPendingApprovalContributionId(null);
                    }}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveTimesAndApprove}
                    disabled={routesWithMissingTimes.some(item => !item.route.departureTime)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all shadow-sm hover:shadow flex items-center gap-2"
                  >
                    <CheckCircle style={{ width: '16px', height: '16px' }} />
                    Save & Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};