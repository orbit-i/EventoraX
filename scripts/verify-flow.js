// Using built-in global fetch

const BASE_URL = 'http://localhost:5000';

async function runVerification() {
  console.log('=== STEP 1: Check Gateway Status ===');
  const statusRes1 = await fetch(`${BASE_URL}/api/admin/gateway/status`);
  const status1 = await statusRes1.json();
  console.log('Gateway Status:', status1);

  let token = null;

  if (!status1.isInitialized) {
    console.log('\n=== STEP 2: Register First SuperAdmin (Fresh State) ===');
    const setupRes = await fetch(`${BASE_URL}/api/admin/gateway/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Master Authority',
        email: 'master@eventrye.com',
        password: 'SuperAdminPassword123!',
        masterKey: 'MASTERKEY2026'
      })
    });
    const setupData = await setupRes.json();
    console.log('Setup Result:', { success: setupData.success, message: setupData.message, role: setupData.user?.role });
    if (!setupData.success) {
      throw new Error('Failed to setup first superadmin: ' + setupData.message);
    }
    token = setupData.token;
  } else {
    console.log('\n=== SuperAdmin already initialized, testing security lock ===');
  }

  console.log('\n=== STEP 3: Verify Gateway Status is Initialized ===');
  const statusRes2 = await fetch(`${BASE_URL}/api/admin/gateway/status`);
  const status2 = await statusRes2.json();
  console.log('Status (Must be initialized):', status2);
  if (status2.isInitialized !== true || status2.adminCount < 1) {
    throw new Error('Gateway should be initialized!');
  }

  console.log('\n=== STEP 4: Attempt to Register Second SuperAdmin (MUST BE BLOCKED WITH 403) ===');
  const setupRes2 = await fetch(`${BASE_URL}/api/admin/gateway/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Hacker Admin',
      email: 'hacker@eventrye.com',
      password: 'HackerPassword123!',
      masterKey: 'MASTERKEY2026'
    })
  });
  console.log('Second Setup Status Code (Expected 403):', setupRes2.status);
  const setupData2 = await setupRes2.json();
  console.log('Second Setup Response:', setupData2);
  if (setupRes2.status !== 403 || setupData2.success !== false) {
    throw new Error('Security violation: Second superadmin was allowed to register!');
  }

  console.log('\n=== STEP 5: Test Direct Login ===');
  const loginRes = await fetch(`${BASE_URL}/api/admin/gateway/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'master@eventrye.com',
      password: 'SuperAdminPassword123!',
      masterKey: 'MASTERKEY2026'
    })
  });
  const loginData = await loginRes.json();
  console.log('Login Result:', { success: loginData.success, role: loginData.user?.role });
  if (!loginData.success || loginData.user?.role !== 'admin') {
    throw new Error('Failed to login with superadmin credentials!');
  }
  token = loginData.token;

  console.log('\n=== STEP 6: Test Financial & Audit Report for All 8 Periods ===');
  const periods = ['7d', '15d', '1m', '3m', '6m', '1y', '2y', 'all'];
  for (const period of periods) {
    const reportRes = await fetch(`${BASE_URL}/api/admin/reports/financial-audit?interval=${period}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!reportRes.ok) {
      const errTxt = await reportRes.text();
      throw new Error(`Report for period ${period} failed with status ${reportRes.status}: ${errTxt}`);
    }
    const reportData = await reportRes.json();
    console.log(`Period [${period.padEnd(3)}]: success=${reportData.success}, label="${reportData.report?.periodLabel}", grossSales=$${reportData.report?.financials?.grossSalesUsd}, purchases=$${reportData.report?.financials?.totalPurchasesUsd}, netProfit=$${reportData.report?.financials?.netProfitUsd}, margin=${reportData.report?.financials?.profitMarginPercent}%, orgs=${reportData.report?.organizations?.length}, timelineEntries=${reportData.report?.timeline?.length}`);
  }

  console.log('\n=============================================');
  console.log('ALL VERIFICATION TEST STAGES PASSED CLEANLY!');
  console.log('=============================================');
}

runVerification().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
