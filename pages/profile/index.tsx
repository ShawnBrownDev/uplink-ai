"use client";

import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload, User2, Mail, X } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';
import { useRequireAuth } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { Navbar } from '@/components/layout/navbar';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }).optional(),
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

const ProfilePage: NextPage = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
    },
  });

  useEffect(() => {
    const getProfile = async () => {
      try {
        if (!user) return;

        setProfileLoading(true);
        
        // Get profile details from profiles table
        const { data, error } = await getSupabaseClient()
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        form.reset({
          fullName: data?.full_name || '',
          email: user.email || '',
        });
        
        setAvatarUrl(data?.avatar_url || null);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading profile',
          description: 'Your profile could not be loaded. Please try again.',
        });
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      getProfile();
    }
  }, [user, form, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user) return;
      
      setIsSaving(true);
      
      // Update profile
      const { error } = await getSupabaseClient()
        .from('profiles')
        .update({
          full_name: values.fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) throw error;

      // Update email if changed
      if (values.email !== user.email) {
        const { error: updateEmailError } = await getSupabaseClient().auth.updateUser({
          email: values.email,
        });
        
        if (updateEmailError) throw updateEmailError;
        
        toast({
          title: 'Email verification required',
          description: 'Please check your email to verify your new email address.',
        });
      }
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error updating profile',
        description: error.message || 'Your profile could not be updated. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || !event.target.files[0]) return;
      if (!user) return;
      
      const file = event.target.files[0];
      const fileSize = file.size / 1024 / 1024; // Convert to MB
      
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload an image file (JPEG, PNG, etc.)',
        });
        return;
      }
      
      if (fileSize > 2) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload an image smaller than 2MB',
        });
        return;
      }
      
      setIsUploading(true);
      
      // Upload file to Supabase Storage
      const filePath = `avatars/${user.id}-${new Date().getTime()}`;
      const { error: uploadError } = await getSupabaseClient().storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = getSupabaseClient().storage.from('avatars').getPublicUrl(filePath);
      
      if (!data.publicUrl) throw new Error('Could not get public URL for avatar');
      
      // Update profile with new avatar URL
      const { error: updateError } = await getSupabaseClient()
        .from('profiles')
        .update({
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setAvatarUrl(data.publicUrl);
      
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: 'destructive',
        title: 'Error uploading avatar',
        description: error.message || 'Your avatar could not be uploaded. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      if (!user || !avatarUrl) return;
      
      setIsUploading(true);
      
      // Extract filename from URL
      const urlParts = avatarUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Remove file from storage
      const { error: removeError } = await getSupabaseClient().storage
        .from('avatars')
        .remove([`avatars/${fileName}`]);
      
      if (removeError) {
        console.warn('Error removing avatar from storage, continuing with profile update:', removeError);
      }
      
      // Update profile
      const { error: updateError } = await getSupabaseClient()
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setAvatarUrl(null);
      
      toast({
        title: 'Avatar removed',
        description: 'Your profile picture has been removed successfully.',
      });
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast({
        variant: 'destructive',
        title: 'Error removing avatar',
        description: error.message || 'Your avatar could not be removed. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="grid gap-6">
          <Skeleton className="h-[120px] rounded-lg" />
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px] rounded-lg" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Profile</title>
        <meta name="description" content="Manage your profile" />
      </Head>

      {/* Use Navbar instead of MainLayout and pass authentication status */}
      <Navbar isAuthenticated={!!user} />

      {/* Profile content goes here */}
      <div className="container mx-auto py-8 px-4 dark:bg-gray-900 dark:text-gray-200 min-h-[calc(100vh-64px)]"> {/* Added min-height to push footer down */}

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and profile information.
            </p>
          </div>
          
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6">
              {/* Profile Picture */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>
                    This is your public profile picture. It will be displayed on your profile and in comments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                      {profileLoading ? (
                        <Skeleton className="h-24 w-24 rounded-full" />
                      ) : (
                        <div className="relative h-24 w-24 overflow-hidden rounded-full">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt="Profile"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <User2 className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {avatarUrl && !isUploading && (
                        <button
                          className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={removeAvatar}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button asChild variant="outline" disabled={isUploading}>
                        <label htmlFor="avatar" className="cursor-pointer">
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Image
                            </>
                          )}
                        </label>
                      </Button>
                      <input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isUploading}
                      />
                      
                      {avatarUrl && (
                        <Button
                          variant="outline"
                          onClick={removeAvatar}
                          disabled={isUploading}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: JPEG, PNG, GIF. Maximum file size: 2MB.
                  </p>
                </CardContent>
              </Card>
              
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profileLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-1/3" />
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    placeholder="John Smith"
                                    className="pl-10"
                                    {...field}
                                    disabled={isSaving}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                This is your public display name.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    placeholder="email@example.com"
                                    className="pl-10"
                                    {...field}
                                    disabled={isSaving}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                We&apos;ll send a verification link if you change your email.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          disabled={isSaving || !form.formState.isDirty}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving changes...
                            </>
                          ) : (
                            'Save changes'
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Change your password or reset it if you&apos;ve forgotten it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm">
                      To change your password, click the button below to send a password reset link to your email.
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/auth/forgot-password" passHref legacyBehavior>
                      <Button variant="link" className="text-sm text-blue-600 dark:text-blue-400 p-0">
                        Forgot password?
                      </Button>
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sign Out of All Devices</CardTitle>
                  <CardDescription>
                    Sign out from all devices where youre currently logged in.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm">
                      This will sign you out from all devices, including this one. You ll need to sign in again.
                    </p>
                  </div>
                  <Button variant="destructive">
                    Sign out of all devices
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Notification preferences will be available in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;