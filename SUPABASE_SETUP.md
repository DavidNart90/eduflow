# Supabase Setup Guide - EduFlow

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `eduflow`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Project Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Set Up Environment Variables

1. Copy `env.example` to `.env.local`
2. Fill in your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Initialize Database Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL script
4. Verify tables are created in **Table Editor**

## 📊 Database Schema

### Tables

#### `users`

- **id**: UUID (Primary Key)
- **employee_id**: VARCHAR(50) (Unique)
- **email**: VARCHAR(255) (Unique)
- **full_name**: VARCHAR(255)
- **role**: ENUM('teacher', 'admin')
- **management_unit**: VARCHAR(100)
- **phone_number**: VARCHAR(20)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

#### `savings_transactions`

- **id**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key to users)
- **transaction_type**: ENUM('momo', 'controller', 'interest')
- **amount**: DECIMAL(10,2)
- **description**: TEXT
- **transaction_date**: DATE
- **status**: ENUM('pending', 'completed', 'failed')
- **reference_id**: VARCHAR(255)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

#### `controller_reports`

- **id**: UUID (Primary Key)
- **report_month**: INTEGER (1-12)
- **report_year**: INTEGER
- **file_name**: VARCHAR(255)
- **file_url**: TEXT
- **uploaded_by**: UUID (Foreign Key to users)
- **status**: ENUM('pending', 'processed', 'failed')
- **processed_at**: TIMESTAMP
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

#### `email_notifications`

- **id**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key to users)
- **type**: ENUM('statement', 'payment_confirmation', 'system')
- **subject**: VARCHAR(255)
- **content**: TEXT
- **sent_at**: TIMESTAMP
- **status**: ENUM('pending', 'sent', 'failed')
- **created_at**: TIMESTAMP

### Views

#### `teacher_balances`

Aggregated view showing:

- Total contributions (momo + controller)
- Total interest
- Total balance
- Last transaction date

### Functions

#### `get_teacher_balance(teacher_id UUID)`

Returns the current balance for a teacher.

#### `add_savings_transaction(...)`

Safely adds a new transaction with validation.

## 🔐 Row Level Security (RLS)

### Policies Implemented

1. **Users Table**:
   - Users can view their own profile
   - Admins can view all users
   - Users can update their own profile
   - Admins can insert new users

2. **Transactions Table**:
   - Users can view their own transactions
   - Admins can view all transactions
   - Admins can insert transactions

3. **Reports Table**:
   - Only admins can manage reports

4. **Notifications Table**:
   - Users can view their own notifications
   - Admins can manage all notifications

## 🛠️ Local Development

### Install Supabase CLI

```bash
npm install -g supabase
```

### Initialize Local Supabase

```bash
supabase init
supabase start
```

### Apply Schema Changes

```bash
supabase db reset
```

### Generate Types

```bash
supabase gen types typescript --local > src/types/database.ts
```

## 🔧 Configuration

### Authentication Settings

1. Go to **Authentication** → **Settings**
2. Configure:
   - **Site URL**: `http://localhost:3000` (dev) / `https://your-domain.com` (prod)
   - **Redirect URLs**: Add your app URLs
   - **Email Templates**: Customize as needed

### Storage Settings

1. Go to **Storage** → **Settings**
2. Configure:
   - **File size limit**: 50MB
   - **Allowed file types**: Configure as needed

### Email Settings

1. Go to **Authentication** → **Email Templates**
2. Customize templates for:
   - Email confirmation
   - Password reset
   - Magic link

## 📝 Environment Variables

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Authentication
NEXTAUTH_SECRET=

# Payment (Flutterwave)
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_ENCRYPTION_KEY=

# Email
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
```

### Optional Variables

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=EduFlow
NEXT_PUBLIC_APP_DESCRIPTION="Teachers' Savings Management System"

# Email
EMAIL_FROM=noreply@eduflow.com
SMTP_PORT=587
```

## 🔍 Testing

### Test Database Connection

```bash
npm run dev
# Check browser console for connection errors
```

### Test Authentication

1. Go to **Authentication** → **Users**
2. Create a test user
3. Try logging in with the app

### Test RLS Policies

1. Create test users with different roles
2. Verify they can only access appropriate data
3. Test admin vs teacher permissions

## 🚨 Security Checklist

- [ ] RLS policies are enabled on all tables
- [ ] Service role key is kept secret (server-side only)
- [ ] Anon key is safe for client-side use
- [ ] Email confirmations are configured
- [ ] Password policies are set
- [ ] Rate limiting is configured
- [ ] Backup strategy is in place

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Authentication](https://supabase.com/docs/guides/auth)
- [Storage](https://supabase.com/docs/guides/storage)

## 🆘 Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Check environment variables
   - Verify project URL and keys
   - Ensure network connectivity

2. **RLS Policy Issues**:
   - Check user authentication
   - Verify user roles
   - Test policies in SQL editor

3. **Type Generation**:
   - Run `supabase gen types` after schema changes
   - Restart TypeScript server in VS Code

4. **Local Development**:
   - Use `supabase start` to start local instance
   - Check Docker is running
   - Verify ports are available
