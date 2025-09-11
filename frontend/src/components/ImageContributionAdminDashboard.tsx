import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { getImageProcessingStatistics, getPendingImageContributions, approveImageContribution, rejectImageContribution, retryImageProcessing } from '../services/api';

interface ImageContribution {
  id: string;
  userId: string;
  description: string;
  location: string;
  routeName: string;
  imageUrl: string;
  status: string;
  submissionDate: string;
  processedDate?: string;
  validationMessage?: string;
  extractedData?: string;
  additionalNotes?: string;
}

interface ProcessingStats {
  totalImages: number;
  processing: number;
  processed: number;
  failed: number;
  needsReview: number;
  lowConfidence: number;
  successRate: number;
}

const ImageContributionAdminDashboard: React.FC = () => {
  const [contributions, setContributions] = useState<ImageContribution[]>([]);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContribution, setSelectedContribution] = useState<ImageContribution | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contributionsData, statsData] = await Promise.all([
        getPendingImageContributions(),
        getImageProcessingStatistics()
      ]);
      
      setContributions(contributionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contributionId: string) => {
    try {
      setActionLoading(contributionId);
      await approveImageContribution(contributionId);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error approving contribution:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (contributionId: string, reason: string) => {
    try {
      setActionLoading(contributionId);
      await rejectImageContribution(contributionId, reason);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting contribution:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async (contributionId: string) => {
    try {
      setActionLoading(contributionId);
      await retryImageProcessing(contributionId);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error retrying processing:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PROCESSING': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'PROCESSED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'MANUAL_REVIEW_NEEDED': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      'LOW_CONFIDENCE_OCR': { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      'PROCESSING_FAILED': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'APPROVED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'REJECTED': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', icon: Clock };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const filteredContributions = contributions.filter(contribution => {
    if (filter === 'all') return true;
    return contribution.status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Image Contribution Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage and review AI-processed bus schedule image contributions
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalImages}</div>
            <div className="text-sm text-gray-600">Total Images</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
            <div className="text-sm text-gray-600">Processed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.needsReview}</div>
            <div className="text-sm text-gray-600">Needs Review</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.successRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'MANUAL_REVIEW_NEEDED', 'LOW_CONFIDENCE_OCR', 'PROCESSING_FAILED', 'PROCESSED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Contributions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processing Results
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContributions.map((contribution) => (
                <tr key={contribution.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={contribution.imageUrl}
                        alt="Contribution"
                        className="h-16 w-16 object-cover rounded-lg cursor-pointer"
                        onClick={() => setSelectedContribution(contribution)}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {contribution.description}
                    </div>
                    <div className="text-sm text-gray-500">
                      Location: {contribution.location}
                    </div>
                    <div className="text-sm text-gray-500">
                      Route: {contribution.routeName || 'Not specified'}
                    </div>
                    <div className="text-sm text-gray-500">
                      User: {contribution.userId}
                    </div>
                    <div className="text-sm text-gray-500">
                      Submitted: {new Date(contribution.submissionDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(contribution.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {contribution.validationMessage && (
                        <div className="mb-2">
                          <strong>Message:</strong> {contribution.validationMessage}
                        </div>
                      )}
                      {contribution.extractedData && (
                        <div className="bg-gray-100 p-2 rounded text-xs">
                          <strong>Extracted Data:</strong>
                          <pre className="whitespace-pre-wrap mt-1">
                            {contribution.extractedData.substring(0, 200)}
                            {contribution.extractedData.length > 200 && '...'}
                          </pre>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedContribution(contribution)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {contribution.status === 'MANUAL_REVIEW_NEEDED' && (
                        <>
                          <button
                            onClick={() => handleApprove(contribution.id)}
                            disabled={actionLoading === contribution.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(contribution.id, 'Manual review rejection')}
                            disabled={actionLoading === contribution.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {contribution.status === 'PROCESSING_FAILED' && (
                        <button
                          onClick={() => handleRetry(contribution.id)}
                          disabled={actionLoading === contribution.id}
                          className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Modal */}
      {selectedContribution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Image Contribution Details</h3>
                <button
                  onClick={() => setSelectedContribution(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedContribution.imageUrl}
                    alt="Contribution"
                    className="w-full rounded-lg"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    {getStatusBadge(selectedContribution.status)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{selectedContribution.description}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="text-sm text-gray-900">{selectedContribution.location}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Route Name</label>
                    <p className="text-sm text-gray-900">{selectedContribution.routeName || 'Not specified'}</p>
                  </div>
                  
                  {selectedContribution.validationMessage && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Validation Message</label>
                      <p className="text-sm text-gray-900">{selectedContribution.validationMessage}</p>
                    </div>
                  )}
                  
                  {selectedContribution.extractedData && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Extracted Data</label>
                      <div className="bg-gray-100 p-3 rounded text-sm">
                        <pre className="whitespace-pre-wrap">{selectedContribution.extractedData}</pre>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-3 pt-4">
                    {selectedContribution.status === 'MANUAL_REVIEW_NEEDED' && (
                      <>
                        <button
                          onClick={() => {
                            handleApprove(selectedContribution.id);
                            setSelectedContribution(null);
                          }}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            handleReject(selectedContribution.id, 'Manual review rejection');
                            setSelectedContribution(null);
                          }}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                    {selectedContribution.status === 'PROCESSING_FAILED' && (
                      <button
                        onClick={() => {
                          handleRetry(selectedContribution.id);
                          setSelectedContribution(null);
                        }}
                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                      >
                        Retry Processing
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageContributionAdminDashboard;