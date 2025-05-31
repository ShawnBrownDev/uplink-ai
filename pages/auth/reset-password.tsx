"use client";

import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2, Check, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const formSchema = z
  .object({
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const ResetPassword: NextPage = () => {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isValidLink, setIsValidLink] = useState<boolean | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Validate the reset password link
  useEffect(() => {
    const validateResetLink = async () => {
      try {
        // The URL should contain the access token and refresh token
        // Typically handled automatically by Supabase Auth
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          setIsValidLink(false);
          setErrorMessage('Invalid or expired password reset link.');
          return;
        }
        
        setIsValidLink(true);
      } catch (error) {
        console.error('Error validating reset link:', error);
        setIsValidLink(false);
        setErrorMessage('Invalid or expired password reset link.');
      }
    };

    validateResetLink();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const { success, error } = await updatePassword(values.password);
      
      if (!success && error) {
        setErrorMessage(error);
        return;
      }
      
      setIsSuccess(true);

      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (error) {
      console.error('Password update error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password - Supabase App</title>
        <meta name="description" content="Create a new password" />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
        <div className="mx-auto max-w-md w-full">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Create New Password</CardTitle>
              <CardDescription>
                Enter a new password for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isValidLink === false && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              {errorMessage && isValidLink !== false && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              {isSuccess ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Password Updated</h3>
                  <p className="text-muted-foreground">
                    Your password has been successfully updated. You will be redirected to the sign in page shortly.
                  </p>
                </div>
              ) : (
                isValidLink && (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  className="pl-10"
                                  {...field}
                                  disabled={isLoading}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  className="pl-10"
                                  {...field}
                                  disabled={isLoading}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating password...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </form>
                  </Form>
                )
              )}
            </CardContent>
            {isValidLink === false && (
              <CardFooter className="justify-center">
                <Button asChild variant="outline">
                  <a href="/auth/forgot-password">
                    Request a new password reset link
                  </a>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
    </>
  );
};

export default ResetPassword;