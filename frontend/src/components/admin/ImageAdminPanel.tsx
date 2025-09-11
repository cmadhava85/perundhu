import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import AdminService from '../../services/adminService';
import type { ImageContribution } from '../../types/admin';
import { 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Trash2, 
  Calendar, 
  User,
  MapPin,
  Image as ImageIcon,
  Download,
  ExternalLink
} from 'lucide-react';

const ImageAdminPanel: React.FC = () => {
  const [contributions, setContributions] = useState<ImageContribution[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<ImageContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedContribution, setSelectedContribution] = useState<ImageContribution | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    fetchImageContributions();
  }, []);

  useEffect(() => {
    filterContributions();
  }, [contributions, searchTerm, statusFilter]);

  const fetchImageContributions = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getImageContributions();
      setContributions(data);
    } catch (error) {
      console.error('Error fetching image contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContributions = () => {
    let filtered = contributions;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(contribution => contribution.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(contribution =>
        contribution.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contribution.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contribution.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contribution.id?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContributions(filtered);
  };

  const handleApprove = async (contribution: ImageContribution) => {
    if (!contribution.id) return;
    
    try {
      await AdminService.approveImageContribution(contribution.id);
      await fetchImageContributions();
      setShowApprovalDialog(false);
      setApprovalNotes('');
      setSelectedContribution(null);
    } catch (error) {
      console.error('Error approving image contribution:', error);
    }
  };

  const handleReject = async (contribution: ImageContribution) => {
    if (!contribution.id || !rejectionReason.trim()) return;
    
    try {
      await AdminService.rejectImageContribution(contribution.id, rejectionReason);
      await fetchImageContributions();
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedContribution(null);
    } catch (error) {
      console.error('Error rejecting image contribution:', error);
    }
  };

  const handleDelete = async (contribution: ImageContribution) => {
    if (!contribution.id) return;
    
    try {
      await AdminService.deleteImageContribution(contribution.id);
      await fetchImageContributions();
      setShowDeleteDialog(false);
      setSelectedContribution(null);
    } catch (error) {
      console.error('Error deleting image contribution:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{contributions.length}</p>
                <p className="text-sm text-gray-600">Total Images</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {contributions.filter(c => c.status === 'PENDING').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {contributions.filter(c => c.status === 'APPROVED').length}
                </p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <X className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {contributions.filter(c => c.status === 'REJECTED').length}
                </p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Image Contributions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by description, user, location, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Contributions List */}
      <Card>
        <CardHeader>
          <CardTitle>Image Contributions ({filteredContributions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContributions.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No image contributions</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'No contributions match your current filters.'
                  : 'No image contributions have been submitted yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContributions.map((contribution) => (
                <div key={contribution.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusBadgeColor(contribution.status || 'PENDING')}>
                          {contribution.status || 'PENDING'}
                        </Badge>
                        <span className="text-sm text-gray-500">ID: {contribution.id}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <strong>Submitted by:</strong> {contribution.submittedBy || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <strong>Submitted:</strong> {formatDate(contribution.submissionDate)}
                            </span>
                          </div>
                          {contribution.processedDate && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">
                                <strong>Processed:</strong> {formatDate(contribution.processedDate)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {contribution.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">
                                <strong>Location:</strong> {contribution.location}
                              </span>
                            </div>
                          )}
                          {contribution.description && (
                            <div className="flex items-start space-x-2">
                              <ImageIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                              <span className="text-sm">
                                <strong>Description:</strong> {contribution.description}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {contribution.validationMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-700">
                            <strong>Validation Message:</strong> {contribution.validationMessage}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContribution(contribution);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {contribution.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => {
                              setSelectedContribution(contribution);
                              setShowApprovalDialog(true);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedContribution(contribution);
                              setShowRejectDialog(true);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setSelectedContribution(contribution);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Image Contribution Details</DialogTitle>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID</Label>
                  <p className="text-sm text-gray-600">{selectedContribution.id}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusBadgeColor(selectedContribution.status || 'PENDING')}>
                    {selectedContribution.status || 'PENDING'}
                  </Badge>
                </div>
                <div>
                  <Label>Submitted By</Label>
                  <p className="text-sm text-gray-600">{selectedContribution.submittedBy || 'Unknown'}</p>
                </div>
                <div>
                  <Label>Submitted Date</Label>
                  <p className="text-sm text-gray-600">{formatDate(selectedContribution.submissionDate)}</p>
                </div>
                {selectedContribution.processedDate && (
                  <div>
                    <Label>Processed Date</Label>
                    <p className="text-sm text-gray-600">{formatDate(selectedContribution.processedDate)}</p>
                  </div>
                )}
                {selectedContribution.location && (
                  <div>
                    <Label>Location</Label>
                    <p className="text-sm text-gray-600">{selectedContribution.location}</p>
                  </div>
                )}
              </div>
              
              {selectedContribution.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedContribution.description}</p>
                </div>
              )}

              {selectedContribution.imageUrl && (
                <div>
                  <Label>Image</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img 
                      src={selectedContribution.imageUrl} 
                      alt="Contribution" 
                      className="w-full h-auto max-h-96 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                      }}
                    />
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedContribution.imageUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = selectedContribution.imageUrl!;
                        link.download = `image-contribution-${selectedContribution.id}.jpg`;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {selectedContribution.validationMessage && (
                <div>
                  <Label>Validation Message</Label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-700">{selectedContribution.validationMessage}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Image Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to approve this image contribution?</p>
            <div>
              <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about the approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedContribution && handleApprove(selectedContribution)}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Image Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Please provide a reason for rejecting this image contribution:</p>
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this contribution is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedContribution && handleReject(selectedContribution)}
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectionReason.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to permanently delete this image contribution? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedContribution && handleDelete(selectedContribution)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageAdminPanel;