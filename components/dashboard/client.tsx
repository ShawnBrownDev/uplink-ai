import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Upload, Trash2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { DashboardClientProps, Upload as UploadType, UserStats } from '@/lib/types';
import Link from 'next/link';

export default function DashboardClient({ userId, initialUploads, initialStats }: DashboardClientProps) {
  const [uploadsMap, setUploadsMap] = useState<Map<string, UploadType>>(
    new Map(initialUploads?.map(upload => [upload.id, upload]))
  );

  const uploads = Array.from(uploadsMap.values());

  const [stats, setStats] = useState<UserStats>(initialStats || {
    total_uploads: 0,
    storage_used: 0,
    last_upload: null
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = getSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('uploads_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'uploads',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newUpload = payload.new as UploadType;

          // Update the map based on event type
          setUploadsMap(currentMap => {
            const updatedMap = new Map(currentMap);

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              updatedMap.set(newUpload.id, newUpload);
            } else if (payload.eventType === 'DELETE') {
              updatedMap.delete(payload.old.id);
            }

            return updatedMap;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('User stats update received:', payload.new);
          setStats(payload.new as UserStats);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && file.type !== 'text/csv') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF or CSV file.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileAction = async (upload: UploadType) => {
    try {
      // Extract the file path from the URL
      const filePath = upload.url.includes('storage/v1/object/public/uploads/')
        ? upload.url.split('storage/v1/object/public/uploads/')[1]
        : upload.url;

      // Get a signed URL for the file
      const { data, error: signedUrlError } = await supabase.storage
        .from('uploads')
        .createSignedUrl(filePath, 60); // URL valid for 60 seconds

      if (signedUrlError || !data?.signedUrl) {
        console.error('Error getting signed URL:', signedUrlError);
        toast({
          title: 'Error',
          description: 'Could not access the file. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Update the status to processing
      const { error: updateError } = await supabase
        .from('uploads')
        .update({ status: 'processing' })
        .eq('id', upload.id);

      if (updateError) {
        console.error('Error updating status:', updateError);
      }

      // Open the file in a new tab
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error handling file action:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while processing the file.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (upload: UploadType) => {
    try {
      // Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([upload.url]);
      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        toast({
          title: 'Delete failed',
          description: 'Could not delete the file from storage.',
          variant: 'destructive',
        });
        return;
      }

      // Delete from uploads table
      const { error: dbError } = await supabase
        .from('uploads')
        .delete()
        .eq('id', upload.id);
      if (dbError) {
        console.error('Error deleting from database:', dbError);
        toast({
          title: 'Delete failed',
          description: 'Could not delete the file from the database.',
          variant: 'destructive',
        });
        return;
      }

      // Update user stats after successful deletion
      const { error: statsUpdateError } = await supabase
        .from('user_stats')
        .update({
          total_uploads: Math.max(0, stats.total_uploads - 1), // Ensure total_uploads doesn't go below 0
          storage_used: Math.max(0, stats.storage_used - upload.file_size) // Ensure storage_used doesn't go below 0
          // We don't update last_upload on deletion as it tracks the last upload time
        })
        .eq('user_id', userId);

      if (statsUpdateError) {
        console.error('Error updating user stats after deletion:', statsUpdateError);
        // Optionally, handle this error, maybe revert the deletion or log it
      }

      // Remove from UI
      setUploadsMap(currentMap => {
        const updatedMap = new Map(currentMap);
        updatedMap.delete(upload.id);
        return updatedMap;
      });
      toast({
        title: 'File deleted',
        description: `${upload.file_name} was deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting the file.',
        variant: 'destructive',
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to Supabase Storage
      const filePath = `${userId}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      // Create record in uploads table
      const { data: uploadData, error: dbError } = await supabase
        .from('uploads')
        .insert({
          user_id: userId,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          status: 'pending',
          url: publicUrl
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Update user stats (This will also trigger the real-time update for stats)
      const { error: statsError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          total_uploads: stats.total_uploads + 1,
          storage_used: stats.storage_used + selectedFile.size,
          last_upload: new Date().toISOString()
        });

      if (statsError) {
        console.error('Error updating user stats:', statsError);
      }

      // Simulate processing flow:
      setUploadsMap(currentMap => new Map(currentMap).set(uploadData.id, { ...uploadData, status: 'pending' }));

      setTimeout(async () => {
        await supabase
          .from('uploads')
          .update({ status: 'processing' })
          .eq('id', uploadData.id);
        // The real-time subscription will handle the UI update to processing
        
        setTimeout(async () => {
          await supabase
            .from('uploads')
            .update({ status: 'completed' })
            .eq('id', uploadData.id);
          // The real-time subscription will handle the UI update to completed
        }, 3000); // Simulate 3 seconds of processing

      }, 1000); // Simulate 1 second delay before processing starts

      setSelectedFile(null);
      toast({
        title: 'Upload successful',
        description: `${selectedFile.name} was uploaded successfully.`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: 'An error occurred while uploading the file.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_uploads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.storage_used)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="file"
              accept=".pdf,.csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploads.map((upload) => (
                <TableRow key={upload.id}>
                  <TableCell>{upload.file_name}</TableCell>
                  <TableCell>{formatFileSize(upload.file_size)}</TableCell>
                  <TableCell>{upload.file_type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        upload.status === 'completed'
                          ? 'default'
                          : upload.status === 'processing'
                          ? 'secondary'
                          : upload.status === 'failed'
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {upload.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(upload.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFileAction(upload)}
                        disabled={upload.status !== 'completed'}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(upload)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 