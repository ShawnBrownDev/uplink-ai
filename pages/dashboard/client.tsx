'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Upload, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';
import { DashboardClientProps, Upload as UploadType, UserStats } from '@/lib/types';

export function DashboardClient({ userId, initialUploads, initialStats }: DashboardClientProps) {
  const [uploads, setUploads] = useState<UploadType[]>(initialUploads || []);   
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
          if (payload.eventType === 'INSERT') {
            setUploads((current) => [payload.new as UploadType, ...current]);
            setStats((current) => ({
              ...current,
              total_uploads: current.total_uploads + 1,
              last_upload: payload.new.created_at,
            }));
          } else if (payload.eventType === 'DELETE') {
            setUploads((current) =>
              current.filter((upload) => upload.id !== payload.old.id)
            );
          } else if (payload.eventType === 'UPDATE') {
            setUploads((current) =>
              current.map((upload) =>
                upload.id === payload.new.id ? (payload.new as UploadType) : upload
              )
            );
          }
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

      // Simulate processing (replace this with your actual processing logic)
      setTimeout(async () => {
        const { error: completeError } = await supabase
          .from('uploads')
          .update({ status: 'completed' })
          .eq('id', upload.id);

        if (completeError) {
          console.error('Error updating status:', completeError);
        }
      }, 2000);
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

      // Remove from UI
      setUploads((current) => current.filter((u) => u.id !== upload.id));
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
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Insert with 'pending'
      const { data: insertedUpload, error: insertError } = await supabase
        .from('uploads')
        .insert({
          user_id: userId,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          status: 'pending',
          url: fileName,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // Simulate processing, then update status
      if (insertedUpload) {
        setTimeout(async () => {
          await supabase.from('uploads').update({ status: 'completed' }).eq('id', insertedUpload.id);
        }, 2000);
      }

      toast({
        title: 'Upload successful',
        description: 'Your file has been uploaded and is being processed.',
      });

      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'There was an error uploading your file.',
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
    <div className="container mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Welcome to Uplink AI</h1>
        <p className="text-gray-600">Upload and process your documents with AI</p>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".pdf,.csv"
            onChange={handleFileChange}
            className="flex-1"
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="min-w-[100px]"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Upload</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.last_upload
                ? new Date(stats.last_upload).toLocaleDateString()
                : 'Never'}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Uploads Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploads.map((upload) => (
              <TableRow key={upload.id}>
                <TableCell className="font-medium">{upload.file_name}</TableCell>
                <TableCell>{upload.file_type}</TableCell>
                <TableCell>{formatFileSize(upload.file_size)}</TableCell>
                <TableCell>
                  {new Date(upload.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      upload.status === 'completed'
                        ? 'default'
                        : upload.status === 'failed'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {upload.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileAction(upload)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(upload)}
                      aria-label="Delete file"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}