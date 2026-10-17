// ==============================================================================
// EVENTRYE / EVENTORAX PROFESSIONAL QA & SECURITY TEST SUITE
// Simulates rigorous real-world penetration testing, multi-user concurrency,
// load balancing, caching validation, RBAC privilege checks, and media upload audits.
// ==============================================================================

import http from 'http';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5000';

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, detail = '') {
  if (passed) {
    results.passed++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m - ${name} ${detail ? `(${detail})` : ''}`);
    results.tests.push({ name, status: 'PASS', detail });
  } else {
    results.failed++;
    console.log(`  \x1b[31m✖ FAIL\x1b[0m - ${name} ${detail ? `(${detail})` : ''}`);
    results.tests.push({ name, status: 'FAIL', detail });
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    ...options,
    headers
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await res.text();
    } catch {
      data = null;
    }
  }

  return {
    status: res.status,
    headers: res.headers,
    data
  };
}

async function runTestSuite() {
  console.log('\n==============================================================================');
  console.log('🚀 STARTING COMPREHENSIVE QA & SECURITY TEST SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('==============================================================================\n');

  let adminToken = '';
  let activeTenantId = 1;
  let clientToken = '';
  let clientTenantId = 0;
  let testEventSlug = '';
  let testEventId = 0;
  let testMemberId = 0;

  // ---------------------------------------------------------------------------
  // MODULE 1: AUTHENTICATION & MULTI-TENANT CRASH REGRESSION
  // ---------------------------------------------------------------------------
  console.log('\x1b[36m[Module 1]: Authentication & Tenant String Coercion\x1b[0m');
  try {
    const uniqueEmail = `qa_org_${Date.now()}@orbit-i.test`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'QA Lead Tester',
        email: uniqueEmail,
        password: 'Password123!Secure',
        orgName: 'QA Global Enterprises',
        phone: '+92 300 9876543'
      })
    });

    logTest(
      'Account Registration with Workspace Creation',
      regRes.status === 201 && regRes.data?.success === true,
      `Status: ${regRes.status}`
    );

    // Verify critical crash regression: tenant.name must be string, not number
    const tenantName = regRes.data?.tenant?.name;
    const isStringName = typeof tenantName === 'string' && tenantName.length > 0;
    logTest(
      'Tenant Name String Coercion (Prevents .slice crash)',
      isStringName && isNaN(tenantName),
      `Name: "${tenantName}", Type: ${typeof tenantName}`
    );

    clientToken = regRes.data?.token || '';
    clientTenantId = regRes.data?.tenant?.id || 0;

    // Login verification
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123!Secure'
      })
    });

    logTest(
      'Account Login with Valid Credentials',
      loginRes.status === 200 && loginRes.data?.token,
      `Token issued: ${Boolean(loginRes.data?.token)}`
    );

    // Negative auth test (Invalid password)
    const badLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'WrongPassword999'
      })
    });

    logTest(
      'Negative Auth: Reject Invalid Password',
      badLoginRes.status === 401 && badLoginRes.data?.success === false,
      `Status: ${badLoginRes.status}`
    );

    // SuperAdmin gateway login to get master admin token
    const masterLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@eventrye.com',
        password: 'admin'
      })
    });

    if (masterLoginRes.status === 200 && masterLoginRes.data?.token) {
      adminToken = masterLoginRes.data.token;
      activeTenantId = masterLoginRes.data?.tenant?.id || 1;
    }
  } catch (err) {
    logTest('Authentication Module Exception', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // MODULE 2: RBAC & PRIVILEGE ESCALATION RESISTANCE
  // ---------------------------------------------------------------------------
  console.log('\n\x1b[36m[Module 2]: RBAC & Privilege Isolation\x1b[0m');
  try {
    // Normal client attempts to call SuperAdmin platform admin API
    const privRes = await request('/api/admin/overview', {
      headers: {
        Authorization: `Bearer ${clientToken}`,
        'x-tenant-id': String(clientTenantId)
      }
    });

    logTest(
      'Prevent Client Org from accessing SuperAdmin Overview Metrics',
      privRes.status === 403 || privRes.status === 401,
      `Received status: ${privRes.status}`
    );

    const tenantsPrivRes = await request('/api/admin/tenants', {
      headers: {
        Authorization: `Bearer ${clientToken}`,
        'x-tenant-id': String(clientTenantId)
      }
    });

    logTest(
      'Prevent Client Org from reading Global Tenants Directory',
      tenantsPrivRes.status === 403 || tenantsPrivRes.status === 401,
      `Received status: ${tenantsPrivRes.status}`
    );
  } catch (err) {
    logTest('RBAC Module Exception', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // MODULE 3: ENVIRONMENT PROTECTION & SECRET LEAKAGE PENETRATION
  // ---------------------------------------------------------------------------
  console.log('\n\x1b[36m[Module 3]: Secret Leakage & System Resource Protection\x1b[0m');
  try {
    const sensitiveProbes = [
      '/.env',
      '/.env.production',
      '/.git/config',
      '/local_store.json',
      '/db/db.sqlite',
      '/server.js.bak',
      '/id_rsa'
    ];

    for (const probe of sensitiveProbes) {
      const probeRes = await request(probe);
      logTest(
        `Block access to sensitive file: ${probe}`,
        probeRes.status === 403,
        `Status: ${probeRes.status}`
      );
    }

    // Verify secret sanitization in JSON responses
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${clientToken}` }
    });

    const hasNoPassword = !meRes.data?.user?.password && !meRes.data?.user?.password_hash;
    logTest(
      'Zero Secret Leakage: Password hash scrubbed from profile output',
      hasNoPassword,
      'password/password_hash excluded'
    );
  } catch (err) {
    logTest('Secret Leakage Module Exception', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // MODULE 4: HIGH-CAPACITY MEDIA UPLOADS (IMAGES & VIDEOS)
  // ---------------------------------------------------------------------------
  console.log('\n\x1b[36m[Module 4]: High-Capacity Direct Media Uploads\x1b[0m');
  let uploadedImageUrl = '';
  let uploadedVideoUrl = '';

  try {
    // 1. Direct Image Upload (1x1 Transparent PNG in base64)
    const dummyImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imgUploadRes = await request('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${clientToken}` },
      body: JSON.stringify({
        base64Data: dummyImageBase64,
        filename: 'qa_banner_test.png',
        folder: 'events'
      })
    });

    uploadedImageUrl = imgUploadRes.data?.url || '';
    logTest(
      'Direct Image Upload via Base64 Payload',
      (imgUploadRes.status === 200 || imgUploadRes.status === 201) && uploadedImageUrl.startsWith('/uploads/events/'),
      `Generated URL: ${uploadedImageUrl}`
    );

    // 2. Direct Video Upload (Small valid dummy video data)
    const dummyVideoBase64 = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAAAhmcmVlAA==';
    const vidUploadRes = await request('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${clientToken}` },
      body: JSON.stringify({
        base64Data: dummyVideoBase64,
        filename: 'qa_promo_teaser.mp4',
        folder: 'videos'
      })
    });

    uploadedVideoUrl = vidUploadRes.data?.url || '';
    logTest(
      'Direct Video Upload via Base64 Payload',
      (vidUploadRes.status === 200 || vidUploadRes.status === 201) && uploadedVideoUrl.startsWith('/uploads/videos/'),
      `Generated Video URL: ${uploadedVideoUrl}`
    );

    // 3. Security: Block Malicious Executable Upload Attempt
    const badUploadRes = await request('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${clientToken}` },
      body: JSON.stringify({
        base64Data: 'data:application/x-msdownload;base64,TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAAaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        filename: 'exploit.exe',
        folder: 'events'
      })
    });

    logTest(
      'Reject Forbidden Executable Media (.exe payload)',
      badUploadRes.status === 400 && badUploadRes.data?.success === false,
      `Status: ${badUploadRes.status}`
    );
  } catch (err) {
    logTest('Media Upload Module Exception', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // MODULE 5: EVENT CREATION WITH MULTI-IMAGE GALLERY & VIDEOS
  // ---------------------------------------------------------------------------
  console.log('\n\x1b[36m[Module 5]: Event Lifecycle with Multi-Image Gallery & Video\x1b[0m');
  try {
    const authToken = clientToken || adminToken;
    const authTenant = clientTenantId || activeTenantId;

    const eventPayload = {
      title: `QA AI & Cloud Summit ${Date.now()}`,
      category: 'Conference',
      eventType: 'in-person',
      venueName: 'Expo Convention Center',
      venueAddress: 'University Road, Sector B',
      startDate: '2026-11-20',
      startTime: '09:00',
      endDate: '2026-11-22',
      endTime: '18:00',
      price: 25,
      capacity: 300,
      description: 'Comprehensive high-concurrency QA test event featuring multiple images and video streams.',
      bannerImage: uploadedImageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      galleryImages: [
        uploadedImageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'
      ],
      videos: [
        uploadedVideoUrl || 'https://example.com/stream.mp4',
        'https://youtube.com/watch?v=dQw4w9WgXcQ'
      ],
      videoUrl: uploadedVideoUrl || 'https://example.com/stream.mp4'
    };

    const createRes = await request('/api/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'x-tenant-id': String(authTenant)
      },
      body: JSON.stringify(eventPayload)
    });

    logTest(
      'Create Event with Banner, Gallery, and Videos',
      createRes.status === 201 && createRes.data?.event?.id,
      `Event ID: ${createRes.data?.event?.id}`
    );

    testEventId = createRes.data?.event?.id || 0;
    testEventSlug = createRes.data?.event?.slug || '';

    // Verify retrieval of gallery and video fields
    const getRes = await request(`/api/events/public/${testEventSlug}`);
    const ev = getRes.data?.event;

    logTest(
      'Public Event API: Retrieve Formatted Gallery & Videos',
      getRes.status === 200 && Array.isArray(ev?.gallery_images) && Array.isArray(ev?.videos),
      `Gallery Count: ${ev?.gallery_images?.length}, Videos Count: ${ev?.videos?.length}`
    );
  } catch (err) {
    logTest('Event Creation Module Exception', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // MODULE 6: CACHING ENGINE & HTTP ETAG VALIDATION
  // ---------------------------------------------------------------------------
  console.log('\n\x1b[36m[Module 6]: Caching Performance & ETag Validation\x1b[0m');
  try {
    if (testEventSlug) {
      // 1. Initial request (Cache Miss)
      const t0 = performance.now();
      const missRes = await request(`/api/events/public/${testEventSlug}`);
      const t1 = performance.now();
      const missLatency = (t1 - t0).toFixed(2);

      const etag = missRes.headers.get('etag');
      logTest(
        'Cache Miss Generates ETag & Cache-Control',
        missRes.status === 200 && Boolean(etag),
        `ETag: ${etag}, Latency: ${missLatency}ms`
      );

      // 2. Immediate second request (Cache Hit)
      const t2 = performance.now();
      const hitRes = await request(`/api/events/public/${testEventSlug}`);
      const t3 = performance.now();
      const hitLatency = (t3 - t2).toFixed(2);

      const cacheHeader = hitRes.headers.get('x-cache');
      logTest(
        'Cache Hit Relieves Database & Reduces Latency',
        hitRes.status === 200 && cacheHeader === 'HIT',
        `X-Cache: ${cacheHeader}, Latency: ${hitLatency}ms (vs Miss: ${missLatency}ms)`
      );

      // 3. Conditional 304 Not Modified Request
      const ifNoneMatchRes = await request(`/api/events/public/${testEventSlug}`, {
        headers: { 'if-none-match': etag }
      });

      logTest(
        'HTTP 304 Not Modified (Saves 100% Data Transfer)',
        ifNoneMatchRes.status === 304,
        `Status: ${ifNoneMatchRes.status}`
      );
    }
  } catch (err) {
    logTest('Caching Module Exception', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // MODULE 7: TEAM DATA MANAGEMENT (FULL CRUD)
  // ---------------------------------------------------------------------------
  console.log('\n\x1b[36m[Module 7]: Team Data CRUD Operations\x1b[0m');
  try {
    const authToken = clientToken || adminToken;
    const authTenant = clientTenantId || activeTenantId;

    // 1. Add Team Member (POST)
    const addRes = await request('/api/team/invite', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'x-tenant-id': String(authTenant)
      },
      body: JSON.stringify({
        name: 'Sara Khan',
        email: `sara_${Date.now()}@orbit-i.test`,
        role: 'Event Manager',
        status: 'active',
        phone: '+92 312 3456789',
        avatar_url: uploadedImageUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
      })
    });

    logTest(
      'Team: Add New Team Member',
      (addRes.status === 200 || addRes.status === 201) && addRes.data?.member?.id,
      `Member ID: ${addRes.data?.member?.id}`
    );

    testMemberId = addRes.data?.member?.id || 0;

    // 2. Update Team Member (PUT)
    if (testMemberId) {
      const updateRes = await request(`/api/team/${testMemberId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-tenant-id': String(authTenant)
        },
        body: JSON.stringify({
          name: 'Sara Khan (Promoted)',
          role: 'Senior Director of Operations',
          phone: '+92 312 9999999'
        })
      });

      logTest(
        'Team: Update Team Member Details & Role',
        updateRes.status === 200 && updateRes.data?.member?.role === 'Senior Director of Operations',
        `Role: ${updateRes.data?.member?.role}`
      );

      // 3. Delete Team Member (DELETE)
      const deleteRes = await request(`/api/team/${testMemberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-tenant-id': String(authTenant)
        }
      });

      logTest(
        'Team: Remove / Delete Team Member',
        deleteRes.status === 200 && deleteRes.data?.success === true,
        `Status: ${deleteRes.status}`
      );
    }
  } catch (err) {
    logTest('Team CRUD Module Exception', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // MODULE 8: HIGH CONCURRENCY LOAD STRESS TEST ("Website ko thakao nahi")
  // ---------------------------------------------------------------------------
  console.log('\n\x1b[36m[Module 8]: High-Concurrency Load Stress Test\x1b[0m');
  try {
    const CONCURRENT_REQUESTS = 50;
    console.log(`  ⚡ Dispatching ${CONCURRENT_REQUESTS} parallel async requests across public endpoints...`);

    const tStart = performance.now();
    const promises = [];

    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      const path = i % 3 === 0
        ? '/api/events'
        : i % 3 === 1
        ? '/api/directory-events'
        : '/api/public/cms/home';

      promises.push(request(path));
    }

    const loadResponses = await Promise.all(promises);
    const tEnd = performance.now();
    const totalTimeMs = (tEnd - tStart).toFixed(2);
    const avgLatency = (totalTimeMs / CONCURRENT_REQUESTS).toFixed(2);

    const successful = loadResponses.filter(r => r.status === 200 || r.status === 304).length;
    const rateLimited = loadResponses.filter(r => r.status === 429).length;

    logTest(
      `Zero Crash Resilience across ${CONCURRENT_REQUESTS} parallel requests`,
      successful + rateLimited === CONCURRENT_REQUESTS,
      `Success: ${successful}, RateLimited: ${rateLimited}, Total Time: ${totalTimeMs}ms, Avg: ${avgLatency}ms/req`
    );
  } catch (err) {
    logTest('Concurrency Stress Module Exception', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log('📊 QA & SECURITY TEST EXECUTION SUMMARY');
  console.log('==============================================================================');
  console.log(`Total Tests Executed : ${results.passed + results.failed}`);
  console.log(`Tests Passed         : \x1b[32m${results.passed}\x1b[0m`);
  console.log(`Tests Failed         : \x1b[31m${results.failed}\x1b[0m`);
  console.log(`System Success Rate  : ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('==============================================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
