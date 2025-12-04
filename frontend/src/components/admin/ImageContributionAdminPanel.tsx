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
  User
} from 'lucide-react';

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
  stops?: Array<{
    name: string;
    arrivalTime?: string;
    departureTime?: string;
  }>;
  confidence?: number;
  originRequired?: boolean;
  originHint?: string;
  boardFormat?: string;
  multipleRoutes?: Array<{
    fromLocation: string;
    toLocation: string;
    via?: string;
    timings: string[];
  }>;
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

  useEffect(() => {
    console.log('showOCRModal changed:', showOCRModal);
    console.log('ocrData:', ocrData);
    if (showOCRModal && ocrData) {
      console.log('Modal should be visible now!');
    }
  }, [showOCRModal, ocrData]);

  useEffect(() => {
    fetchImageContributions();
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
    } catch (error) {
      console.error('Error fetching image contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractOCRData = async (contribution: ImageContribution) => {
    try {
      console.log('Starting OCR extraction for contribution:', contribution.id);
      setExtractingOCRId(contribution.id);
      setSelectedContribution(contribution);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const url = `${API_BASE_URL}/api/admin/contributions/images/${contribution.id}/extract-ocr`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'dev-admin-token'}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('OCR Response Data:', data);
      
      // Map backend field names to frontend field names
      const mappedData = {
        extractedText: data.extractedText || '',
        busNumber: data.busNumber || data.routeNumber,
        origin: data.origin || data.fromLocation,
        destination: data.destination || data.toLocation,
        departureTime: data.departureTime,
        arrivalTime: data.arrivalTime,
        confidence: data.confidence,
        stops: data.stops || [],
        originRequired: data.originRequired || false,
        originHint: data.originHint,
        boardFormat: data.boardFormat,
        multipleRoutes: data.multipleRoutes || []
      };
      
      console.log('Mapped OCR Data:', mappedData);
      console.log('Setting showOCRModal to true');
      setOcrData(mappedData);
      setManualOrigin(''); // Reset manual origin when loading new OCR data
      setShowOCRModal(true);
      console.log('Modal state should be updated now');
    } catch (error) {
      console.error('Error extracting OCR data:', error);
      alert('Failed to extract text from image. Please try again. Error: ' + error);
    } finally {
      setExtractingOCRId(null);
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
    } catch (error) {
      console.error('Error approving contribution:', error);
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
    } catch (error) {
      console.error('Error rejecting contribution:', error);
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
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Image Contributions</h2>
      
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

      {/* OCR Data Modal - Redesigned */}
      {showOCRModal && ocrData && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setShowOCRModal(false)}
        >
          <div 
            className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact Header */}
            <div 
              className="px-6 py-4 flex justify-between items-center border-b-4"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderColor: '#1e40af' }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <svg style={{ width: '24px', height: '24px' }} className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">OCR Extracted Data</h3>
                  <p className="text-blue-100 text-xs">Bus Schedule Information</p>
                </div>
              </div>
              <button
                onClick={() => setShowOCRModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
                title="Close"
              >
                <XCircle style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab('parsed')}
                className={`flex-1 px-6 py-3 font-semibold transition-all ${
                  activeTab === 'parsed'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Parsed Data
                </span>
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`flex-1 px-6 py-3 font-semibold transition-all ${
                  activeTab === 'raw'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Raw Text
                </span>
              </button>
            </div>

            {/* Content Area - Scrollable */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(85vh - 220px)', background: 'linear-gradient(to bottom right, #f9fafb, white)' }}>
              {activeTab === 'parsed' ? (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border-l-4 shadow-sm" style={{ background: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)', borderLeftColor: '#3b82f6' }}>
                      <div className="text-xs font-semibold uppercase mb-1" style={{ color: '#2563eb' }}>Route</div>
                      <div className="text-lg font-bold text-gray-900 truncate">{ocrData.busNumber || 'N/A'}</div>
                    </div>
                    <div className="p-4 rounded-lg border-l-4 shadow-sm" style={{ background: 'linear-gradient(to bottom right, #dcfce7, #bbf7d0)', borderLeftColor: '#22c55e' }}>
                      <div className="text-xs font-semibold uppercase mb-1" style={{ color: '#16a34a' }}>Departure</div>
                      <div className="text-lg font-bold text-gray-900">{ocrData.departureTime || 'N/A'}</div>
                    </div>
                    <div className="p-4 rounded-lg border-l-4 shadow-sm" style={{ background: 'linear-gradient(to bottom right, #f3e8ff, #e9d5ff)', borderLeftColor: '#a855f7' }}>
                      <div className="text-xs font-semibold uppercase mb-1" style={{ color: '#9333ea' }}>Confidence</div>
                      <div className="text-lg font-bold text-gray-900">{ocrData.confidence ? `${Math.round(ocrData.confidence * 100)}%` : 'N/A'}</div>
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

                  {/* Multiple Routes Section */}
                  {ocrData.multipleRoutes && ocrData.multipleRoutes.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <div style={{ background: 'linear-gradient(to right, #dbeafe, #bfdbfe)' }} className="px-4 py-3 border-b border-blue-200">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <svg style={{ width: '20px', height: '20px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          Detected Routes ({ocrData.multipleRoutes.length})
                        </h4>
                      </div>
                      <div className="p-4 max-h-80 overflow-y-auto">
                        <div className="space-y-3">
                          {ocrData.multipleRoutes.map((route, index) => (
                            <div key={`${route.fromLocation}-${route.toLocation}-${index}`} className="p-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors" style={{ backgroundColor: '#f0f9ff' }}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}>
                                  <span className="text-white font-bold text-xs">{index + 1}</span>
                                </div>
                                <div className="flex-1 font-semibold text-gray-900 text-sm flex items-center gap-2">
                                  <span>{route.fromLocation || ocrData.origin || '?'}</span>
                                  <span className="text-blue-500">→</span>
                                  <span>{route.toLocation}</span>
                                </div>
                              </div>
                              {route.via && (
                                <div className="text-xs text-gray-600 ml-8 mb-1">
                                  via <span className="font-medium">{route.via}</span>
                                </div>
                              )}
                              {route.timings && route.timings.length > 0 && (
                                <div className="flex flex-wrap gap-1 ml-8">
                                  {route.timings.map((time, tIdx) => (
                                    <span key={`${time}-${tIdx}`} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                                      {time}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

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
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => setShowOCRModal(false)}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedContribution) {
                      setShowOCRModal(false);
                      rejectContribution(selectedContribution.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all shadow-sm hover:shadow flex items-center gap-2"
                  disabled={processingId !== null}
                >
                  <XCircle style={{ width: '16px', height: '16px' }} />
                  Reject
                </button>
                <button
                  onClick={() => {
                    if (selectedContribution) {
                      setShowOCRModal(false);
                      approveContribution(selectedContribution.id, false);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all shadow-sm hover:shadow flex items-center gap-2"
                  disabled={processingId !== null}
                >
                  <CheckCircle style={{ width: '16px', height: '16px' }} />
                  Approve
                </button>
                <button
                  onClick={() => {
                    if (selectedContribution) {
                      setShowOCRModal(false);
                      approveContribution(selectedContribution.id, true);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all shadow-sm hover:shadow flex items-center gap-2"
                  disabled={processingId !== null}
                >
                  {processingId ? (
                    <>
                      <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle style={{ width: '16px', height: '16px' }} />
                      Approve & Create Routes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};