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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedBy: string;
  description?: string;
  extractedData?: {
    busNumber?: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    arrivalTime?: string;
    confidence?: number;
  };
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
}

export const ImageContributionAdminPanel: React.FC = () => {
  const [contributions, setContributions] = useState<ImageContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<ImageContribution | null>(null);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrData, setOcrData] = useState<OCRData | null>(null);
  const [extractingOCR, setExtractingOCR] = useState(false);

  useEffect(() => {
    fetchImageContributions();
  }, []);

  const fetchImageContributions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/image-contributions');
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
      setExtractingOCR(true);
      setSelectedContribution(contribution);
      const response = await fetch(`/api/v1/admin/image-contributions/${contribution.id}/extract-ocr`, {
        method: 'POST',
      });
      const data = await response.json();
      setOcrData(data);
      setShowOCRModal(true);
    } catch (error) {
      console.error('Error extracting OCR data:', error);
      alert('Failed to extract text from image. Please try again.');
    } finally {
      setExtractingOCR(false);
    }
  };

  const approveContribution = async (contributionId: string, createRoute: boolean = false) => {
    try {
      setProcessingId(contributionId);
      const response = await fetch(`/api/v1/admin/image-contributions/${contributionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ createRouteData: createRoute }),
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
      const response = await fetch(`/api/v1/admin/image-contributions/${contributionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Image Contributions</h2>
        <div className="text-sm text-gray-500">
          Total: {contributions.length} | 
          Pending: {contributions.filter(c => c.status === 'PENDING').length} |
          Approved: {contributions.filter(c => c.status === 'APPROVED').length} |
          Rejected: {contributions.filter(c => c.status === 'REJECTED').length}
        </div>
      </div>

      <div className="grid gap-6">
        {contributions.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No image contributions found</h3>
            <p className="text-gray-500">Image contributions will appear here when users submit them.</p>
          </div>
        ) : (
          contributions.map((contribution) => (
            <div key={contribution.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  <img 
                    src={contribution.imageUrl} 
                    alt="Bus schedule"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>

                {/* Contribution Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Contribution #{contribution.id.slice(-8)}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contribution.status)}`}>
                      {getStatusIcon(contribution.status)}
                      <span className="ml-1">{contribution.status}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <span>Submitted by: {contribution.submittedBy}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Date: {new Date(contribution.submissionDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {contribution.description && (
                    <p className="text-gray-700 mb-4">{contribution.description}</p>
                  )}

                  {contribution.extractedData && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Extracted Data</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {contribution.extractedData.busNumber && (
                          <div>Bus: {contribution.extractedData.busNumber}</div>
                        )}
                        {contribution.extractedData.origin && (
                          <div>From: {contribution.extractedData.origin}</div>
                        )}
                        {contribution.extractedData.destination && (
                          <div>To: {contribution.extractedData.destination}</div>
                        )}
                        {contribution.extractedData.departureTime && (
                          <div>Departure: {contribution.extractedData.departureTime}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => window.open(contribution.imageUrl, '_blank')}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Full Image
                    </button>

                    <button
                      onClick={() => extractOCRData(contribution)}
                      disabled={extractingOCR}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {extractingOCR ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-1" />
                      )}
                      Extract Text
                    </button>

                    {contribution.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => approveContribution(contribution.id, false)}
                          disabled={processingId === contribution.id}
                          className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                        >
                          {processingId === contribution.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          Approve
                        </button>

                        <button
                          onClick={() => rejectContribution(contribution.id)}
                          disabled={processingId === contribution.id}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* OCR Data Modal */}
      {showOCRModal && ocrData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Extracted OCR Data</h3>
                <button
                  onClick={() => setShowOCRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Extracted Text */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Raw Extracted Text</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {ocrData.extractedText}
                    </pre>
                  </div>
                </div>

                {/* Parsed Data */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Parsed Route Information</h4>
                  <div className="space-y-3">
                    {ocrData.busNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bus Number:</span>
                        <span className="font-medium">{ocrData.busNumber}</span>
                      </div>
                    )}
                    {ocrData.origin && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Origin:</span>
                        <span className="font-medium">{ocrData.origin}</span>
                      </div>
                    )}
                    {ocrData.destination && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Destination:</span>
                        <span className="font-medium">{ocrData.destination}</span>
                      </div>
                    )}
                    {ocrData.departureTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Departure:</span>
                        <span className="font-medium">{ocrData.departureTime}</span>
                      </div>
                    )}
                    {ocrData.arrivalTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Arrival:</span>
                        <span className="font-medium">{ocrData.arrivalTime}</span>
                      </div>
                    )}
                    {ocrData.confidence && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-medium">{Math.round(ocrData.confidence * 100)}%</span>
                      </div>
                    )}
                  </div>

                  {ocrData.stops && ocrData.stops.length > 0 && (
                    <div className="mt-6">
                      <h5 className="font-medium text-gray-900 mb-3">Stops</h5>
                      <div className="space-y-2">
                        {ocrData.stops.map((stop, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded border">
                            <div className="font-medium">{stop.name}</div>
                            <div className="text-sm text-gray-600">
                              {stop.arrivalTime && `Arr: ${stop.arrivalTime}`}
                              {stop.arrivalTime && stop.departureTime && ' | '}
                              {stop.departureTime && `Dep: ${stop.departureTime}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowOCRModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedContribution && rejectContribution(selectedContribution.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={processingId !== null}
                >
                  Reject
                </button>
                <button
                  onClick={() => selectedContribution && approveContribution(selectedContribution.id, false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={processingId !== null}
                >
                  Approve Only
                </button>
                <button
                  onClick={() => selectedContribution && approveContribution(selectedContribution.id, true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={processingId !== null}
                >
                  {processingId !== null ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Processing...
                    </>
                  ) : (
                    <>Approve & Create Route Data</>
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