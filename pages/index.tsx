import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Upload, ShieldCheck, BarChart2, Users, Github, Twitter, Linkedin } from 'lucide-react';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';

export default function Home() {
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <section className="max-w-3xl w-full text-center py-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">
            Secure, Effortless Document Management
          </h2>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
            Upload, manage, and analyze your documents with AI-powered insights. Built for teams and professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg">
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
              <h3 className="font-semibold text-lg dark:text-white">Easy Uploads</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Drag & drop or click to upload your documents in seconds.</p>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
              <h3 className="font-semibold text-lg dark:text-white">Secure & Private</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your files are encrypted and protected with enterprise-grade security.</p>
            </div>
            <div className="flex flex-col items-center">
              <BarChart2 className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
              <h3 className="font-semibold text-lg dark:text-white">AI Insights</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Get instant analytics and smart recommendations from your documents.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-center text-gray-400 dark:text-gray-500 text-sm flex flex-col sm:flex-row justify-center items-center gap-4">
        <p>&copy; {new Date().getFullYear()} Uplink AI. All rights reserved.</p>
        <p>
          Created by:{' '}
          <span className="text-blue-600 dark:text-blue-400">
            Shawn Brown
          </span>
        </p>
        <div className="flex gap-4 text-gray-500 dark:text-gray-400">
          <Link href="https://www.github.com/shawnbrowndev" target="_blank" aria-label="GitHub Profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
            <Github className="h-5 w-5" />
          </Link>
          <Link href="#" aria-label="Twitter Profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
            <Twitter className="h-5 w-5" />
          </Link>
          {/* Add more social icons as needed, e.g., LinkedIn */}
          <Link href="https://www.linkedIn.com" aria-label="LinkedIn Profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
            <Linkedin className="h-5 w-5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}