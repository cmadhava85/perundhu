import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import busTimingService from '../../services/busTimingService';
import type { TimingImageContribution, TimingExtractionResult, ExtractedTiming } from '../../types/busTimingTypes';

const BusTimingAdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const [contributions, setContributions] = useState<TimingImageContribution[]>([]);
  const [selectedContribution, setSelectedContribution] = useState<TimingImageContribution | null>(null);
  const [extractedData, setExtractedData] = useState<TimingExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<any>(null);

  useEffect(() => {
    loadPendingContributions();
  }, []);

  const loadPendingContributions = async () => {
    try {
      setLoading(true);
      const data = await busTimingService.getPendingContributions();
      setContributions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load contributions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContribution = async (contribution: TimingImageContribution) => {
    setSelectedContribution(contribution);
    setExtractedData(null);
    setDuplicateCheck(null);
    setError(null);
    setSuccessMessage(null);

    // If already has extracted timings, show them
    if (contribution.extractedTimings) {
      setExtractedData({
        origin: contribution.originLocation,
        originTamil: contribution.originLocationTamil,
        timings: contribution.extractedTimings,
        confidence: contribution.ocrConfidence || 0,
      });
    }
  };

  const handleExtractTimings = async () => {
    if (!selectedContribution?.id) return;

    setIsExtracting(true);
    setError(null);

    try {
      const result = await busTimingService.extractTimings(selectedContribution.id);
      setExtractedData(result);
      
      // Auto-check for duplicates
      await checkDuplicates();
      
      setSuccessMessage('Timings extracted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to extract timings');
    } finally {
      setIsExtracting(false);
    }
  };

  const checkDuplicates = async () => {
    if (!selectedContribution?.id) return;

    try {
      const result = await busTimingService.checkDuplicates(selectedContribution.id);
      setDuplicateCheck(result);
    } catch (err: any) {
      console.error('Duplicate check failed:', err);
    }
  };

  const handleApprove = async () => {
    if (!selectedContribution?.id) return;

    if (!extractedData) {
      setError('Please extract timings first');
      return;
    }

    if (window.confirm('Are you sure you want to approve this contribution and update the database?')) {
      setIsProcessing(true);
      setError(null);

      try {
        await busTimingService.approveContribution(selectedContribution.id, extractedData);
        setSuccessMessage('Contribution approved and database updated!');
        
        // Reload contributions
        await loadPendingContributions();
        setSelectedContribution(null);
        setExtractedData(null);
        setDuplicateCheck(null);
        
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to approve contribution');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReject = async () => {
    if (!selectedContribution?.id) return;

    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    setIsProcessing(true);
    setError(null);

    try {
      await busTimingService.rejectContribution(selectedContribution.id, reason);
      setSuccessMessage('Contribution rejected');
      
      // Reload contributions
      await loadPendingContributions();
      setSelectedContribution(null);
      setExtractedData(null);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject contribution');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateExtractedTiming = (index: number, field: keyof ExtractedTiming, value: any) => {
    if (!extractedData) return;

    const updatedTimings = [...extractedData.timings];
    updatedTimings[index] = {
      ...updatedTimings[index],
      [field]: value,
    };

    setExtractedData({
      ...extractedData,
      timings: updatedTimings,
    });
  };

  const handleAddDestination = () => {
    if (!extractedData) return;

    const newTiming: ExtractedTiming = {
      destination: '',
      morningTimings: [],
      afternoonTimings: [],
      nightTimings: [],
    };

    setExtractedData({
      ...extractedData,
      timings: [...extractedData.timings, newTiming],
    });
  };

  const handleRemoveDestination = (index: number) => {
    if (!extractedData) return;

    const updatedTimings = extractedData.timings.filter((_, i) => i !== index);
    setExtractedData({
      ...extractedData,
      timings: updatedTimings,
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <div style={{ fontSize: '16px', color: '#6B7280' }}>Loading contributions...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1F2937',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '36px' }}>🚌</span>
          Bus Timing Image Review
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
          Review and approve user-submitted bus timing board images
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '16px',
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <span style={{ fontSize: '14px', color: '#DC2626', flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              padding: '4px 8px',
              background: 'transparent',
              border: 'none',
              color: '#DC2626',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '16px',
          background: '#F0FDF4',
          border: '1px solid #86EFAC',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <span style={{ fontSize: '14px', color: '#16A34A', flex: 1 }}>{successMessage}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
        {/* Contributions List */}
        <div>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                Pending Reviews ({contributions.length})
              </h3>
            </div>

            <div style={{ maxHeight: '700px', overflowY: 'auto' }}>
              {contributions.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>
                    No pending contributions
                  </div>
                </div>
              ) : (
                contributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    onClick={() => handleSelectContribution(contribution)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                      cursor: 'pointer',
                      background: selectedContribution?.id === contribution.id
                        ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
                        : '#FFFFFF',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedContribution?.id !== contribution.id) {
                        e.currentTarget.style.background = '#F9FAFB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedContribution?.id !== contribution.id) {
                        e.currentTarget.style.background = '#FFFFFF';
                      }
                    }}
                  >
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1F2937',
                      marginBottom: '4px',
                    }}>
                      📍 {contribution.originLocation}
                    </div>
                    {contribution.originLocationTamil && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6B7280',
                        marginBottom: '8px',
                      }}>
                        {contribution.originLocationTamil}
                      </div>
                    )}
                    <div style={{
                      fontSize: '11px',
                      color: '#9CA3AF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span>By: {contribution.submittedBy || 'Anonymous'}</span>
                      <span>{new Date(contribution.submissionDate || '').toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Review Panel */}
        <div>
          {selectedContribution ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              padding: '24px',
            }}>
              {/* Image Preview */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                  Timing Board Image
                </h3>
                <img
                  src={selectedContribution.imageUrl}
                  alt="Bus timing board"
                  style={{
                    width: '100%',
                    maxHeight: '500px',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                  }}
                />
              </div>

              {/* Extract Button */}
              {!extractedData && (
                <button
                  onClick={handleExtractTimings}
                  disabled={isExtracting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    marginBottom: '24px',
                    background: isExtracting
                      ? '#D1D5DB'
                      : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: isExtracting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isExtracting ? '⏳ Extracting...' : '🔍 Extract Timings (OCR)'}
                </button>
              )}

              {/* Extracted Data Editor */}
              {extractedData && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: 0 }}>
                      Extracted Timings
                    </h3>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      Confidence: {Math.round((extractedData.confidence || 0) * 100)}%
                    </div>
                  </div>

                  {/* Duplicate Warning */}
                  {duplicateCheck?.hasDuplicates && (
                    <div style={{
                      padding: '12px',
                      background: '#FEF3C7',
                      border: '1px solid #FCD34D',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '13px',
                      color: '#92400E',
                    }}>
                      ⚠️ Found {duplicateCheck.duplicateCount} duplicate timing(s). Existing records will be skipped.
                    </div>
                  )}

                  {/* Timings Editor */}
                  <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px' }}>
                    {extractedData.timings.map((timing, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '16px',
                          background: '#F9FAFB',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: '1px solid rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                          <input
                            type="text"
                            value={timing.destination}
                            onChange={(e) => handleUpdateExtractedTiming(index, 'destination', e.target.value)}
                            placeholder="Destination"
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              fontSize: '14px',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              borderRadius: '6px',
                            }}
                          />
                          <button
                            onClick={() => handleRemoveDestination(index)}
                            style={{
                              padding: '8px 12px',
                              background: '#EF4444',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                              காலை (Morning)
                            </div>
                            <input
                              type="text"
                              value={timing.morningTimings.join(', ')}
                              onChange={(e) => handleUpdateExtractedTiming(
                                index,
                                'morningTimings',
                                e.target.value.split(',').map(t => t.trim()).filter(t => t)
                              )}
                              placeholder="07:00, 08:30"
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                fontSize: '12px',
                                border: '1px solid rgba(0, 0, 0, 0.08)',
                                borderRadius: '4px',
                              }}
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                              மாலை (Afternoon)
                            </div>
                            <input
                              type="text"
                              value={timing.afternoonTimings.join(', ')}
                              onChange={(e) => handleUpdateExtractedTiming(
                                index,
                                'afternoonTimings',
                                e.target.value.split(',').map(t => t.trim()).filter(t => t)
                              )}
                              placeholder="12:00, 14:30"
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                fontSize: '12px',
                                border: '1px solid rgba(0, 0, 0, 0.08)',
                                borderRadius: '4px',
                              }}
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                              இரவு (Night)
                            </div>
                            <input
                              type="text"
                              value={timing.nightTimings.join(', ')}
                              onChange={(e) => handleUpdateExtractedTiming(
                                index,
                                'nightTimings',
                                e.target.value.split(',').map(t => t.trim()).filter(t => t)
                              )}
                              placeholder="18:00, 20:30"
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                fontSize: '12px',
                                border: '1px solid rgba(0, 0, 0, 0.08)',
                                borderRadius: '4px',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleAddDestination}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#FFFFFF',
                      color: '#3B82F6',
                      border: '1.5px dashed #3B82F6',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Destination
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing || !extractedData}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: isProcessing || !extractedData
                      ? '#D1D5DB'
                      : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: isProcessing || !extractedData ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isProcessing ? '⏳ Processing...' : '✅ Approve & Update DB'}
                </button>

                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: isProcessing
                      ? '#D1D5DB'
                      : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              padding: '80px 40px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👈</div>
              <div style={{ fontSize: '16px', color: '#6B7280' }}>
                Select a contribution to review
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusTimingAdminPanel;
