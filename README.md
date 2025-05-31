# Next.js with Supabase Authentication

This project is a starter kit for building web applications with Next.js and Supabase, featuring authentication, database, and storage capabilities.

## Features

- **Authentication**: Complete auth flow with sign up, sign in, password reset
- **Database**: Supabase PostgreSQL database integration
- **Storage**: File uploads with Supabase Storage
- **UI Components**: Beautiful UI with shadcn/ui components
- **Responsive Design**: Works on all screen sizes
- **Theme Support**: Light and dark mode
- **Charts & Analytics**: Data visualization

## Getting Started

### Prerequisites

- Node.js 16.8.0 or later
- A Supabase project (create one at [supabase.com](https://supabase.com))

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.local` file
   - Add your Supabase URL and anon key

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Set up the database schema:

Create a `profiles` table in your Supabase project with the following SQL:

```sql
create table profiles (
  id uuid references auth.users on delete cascade,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  primary key (id)
);

-- Create policy to allow users to insert their own profile
create policy "Users can insert their own profile"
on profiles for insert
with check (auth.uid() = id);

-- Create policy to allow users to update their own profile
create policy "Users can update their own profile"
on profiles for update
using (auth.uid() = id);

-- Create policy to allow everyone to view profiles
create policy "Profiles are viewable by everyone"
on profiles for select
using (true);

-- Create storage bucket for avatars
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Create policy to allow users to upload their own avatars
create policy "Users can upload their own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars' AND
  auth.uid() = owner
);

-- Create policy to allow users to update their own avatar
create policy "Users can update their own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars' AND
  auth.uid() = owner
);

-- Create policy to allow users to delete their own avatar
create policy "Users can delete their own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars' AND
  auth.uid() = owner
);

-- Create policy to allow everyone to view avatars
create policy "Avatars are viewable by everyone"
on storage.objects for select
using (bucket_id = 'avatars');

-- Enable Row Level Security
alter table profiles enable row level security;
```

5. Run the development server:

```bash
npm run dev
```

## Project Structure

- `/pages` - Next.js pages
- `/components` - React components
- `/hooks` - Custom React hooks
- `/lib` - Utility functions and libraries
- `/styles` - Global styles and CSS modules
- `/public` - Static assets
- `/types` - TypeScript type definitions

## Technologies Used

- Next.js
- TypeScript
- Supabase
- Tailwind CSS
- shadcn/ui
- Recharts
- React Hook Form
- Zod