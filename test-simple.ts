// Load environment variables from .env.local
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking environment variables...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
console.log(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY:',
  supabaseAnonKey ? '✅ Set' : '❌ Not set'
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Missing environment variables!');
  console.log(
    'Please create a .env.local file with your Supabase credentials.'
  );
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n🔍 Testing Supabase connection...');

    // Test basic connection by checking if we can access the users table
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, role')
      .limit(5);

    if (error) {
      console.log('❌ Connection failed:', error.message);

      if (error.message.includes('relation "users" does not exist')) {
        console.log('\n💡 The database schema is not set up yet.');
        console.log(
          'Please run the SQL schema from supabase/schema-simple.sql in your Supabase dashboard.'
        );
        return false;
      }

      if (error.message.includes('infinite recursion')) {
        console.log('\n💡 RLS policies have recursion issues.');
        console.log(
          'Please run: supabase/disable-rls.sql to disable RLS temporarily.'
        );
        return false;
      }

      return false;
    }

    console.log('✅ Database connection successful!');
    console.log('📊 Users found:', data.length);
    if (data.length > 0) {
      console.log('📊 Sample users:');
      data.forEach(user => {
        console.log(`  - ${user.full_name} (${user.role})`);
      });
    }
    return true;
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Database connection test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the web interface at http://localhost:3000');
    console.log('2. Set up authentication in Supabase dashboard');
    console.log('3. Add more test data as needed');
  } else {
    console.log('\n💡 To fix the database:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Run the schema from supabase/schema-simple.sql');
    console.log('4. If you still get RLS errors, run supabase/disable-rls.sql');
  }
});
