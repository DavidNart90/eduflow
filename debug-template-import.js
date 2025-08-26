// Debug template import to see the exact error
const BASE_URL = 'http://localhost:3000';

// Test credentials
const TEST_CREDENTIALS = {
  identifier: 'ADMIN001',
  password: 'ADMIN001',
};

async function debugTemplateImport() {
  console.log('🔍 Debugging Template Import Issues\n');

  try {
    // Step 1: Authenticate
    console.log('🔐 Step 1: Authenticating...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CREDENTIALS),
    });

    if (!loginResponse.ok) {
      console.error('❌ Authentication failed');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.session.access_token;
    console.log('✅ Authentication successful');

    // Step 2: Try to create a simple template
    console.log('\n📋 Step 2: Creating a test template...');
    const createResponse = await fetch(
      `${BASE_URL}/api/admin/reports/templates`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Import Template',
          type: 'teacher',
          template_data: {
            config: {
              headerColor: '#2563eb',
              font: 'Inter',
              logoPosition: 'top-left',
              includeSignature: true,
              includeWatermark: false,
            },
            version: '1.0',
            elements: [],
            createdBy: 'debug-test',
          },
        }),
      }
    );

    console.log(`Create Response Status: ${createResponse.status}`);

    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('✅ Template created successfully:', result);
    } else {
      const errorData = await createResponse.json();
      console.error('❌ Template creation failed:');
      console.error('Full error response:', JSON.stringify(errorData, null, 2));
    }

    // Step 3: Try to fetch existing templates
    console.log('\n📋 Step 3: Fetching existing templates...');
    const templatesResponse = await fetch(
      `${BASE_URL}/api/admin/reports/templates`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      console.log('✅ Templates fetched successfully:', templatesData);
    } else {
      const templatesError = await templatesResponse.json();
      console.error('❌ Templates fetch failed:', templatesError);
    }
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

debugTemplateImport().then(() => {
  console.log('\n✅ Debug session completed');
});
