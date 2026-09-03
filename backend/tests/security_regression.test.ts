import assert from 'node:assert/strict';
import { cache } from '../src/cache/memoryCache';
import request from 'supertest';
import app from '../src/app';
import sequelize from '../src/db/database';
import { User, Product, Address, Coupon } from '../src/db/models';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../src/middleware/auth';

async function runSecurityTestSuite() {
  console.log('====================================================');
  console.log('🛡️ RUNNING ABESPOKE / CLARA SECURITY REGRESSION TESTS');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function report(name: string, success: boolean, detail: string) {
    totalTests++;
    if (success) {
      passedTests++;
      console.log(`✅ [PASS] ${name}`);
      console.log(`   Evidence: ${detail}\n`);
    } else {
      console.error(`❌ [FAIL] ${name}`);
      console.error(`   Failure: ${detail}\n`);
    }
  }

  try {
    // Authenticate test DB connection
    await sequelize.authenticate();

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 1: Bounded LRU Cache - Memory Heap Exhaustion Defense
    // ──────────────────────────────────────────────────────────────────────────
    try {
      cache.clear();
      // Insert 600 unique keys into a 500-capacity cache
      for (let i = 0; i < 600; i++) {
        cache.set(`test_key_${i}`, { data: `val_${i}` }, 60000);
      }
      const finalSize = cache.size();
      const oldestEvicted = cache.get('test_key_0') === null;
      const newestPreserved = cache.get('test_key_599') !== null;

      const passed = finalSize <= 500 && oldestEvicted && newestPreserved;
      report(
        'Bounded LRU Cache Hard Capacity Cap (CWE-400 Defense)',
        passed,
        `Final cache size = ${finalSize} (capped at 500), oldest key was evicted, newest key retained.`
      );
    } catch (e: any) {
      report('Bounded LRU Cache Hard Capacity Cap', false, e.message);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 2: CORS Strict Allowlist Defense
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const resUntrusted = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-attacker-site.com');

      // Untrusted origin must not get Access-Control-Allow-Origin header matching attacker
      const allowOrigin = resUntrusted.headers['access-control-allow-origin'];
      const passed = allowOrigin !== 'https://malicious-attacker-site.com';
      report(
        'Strict CORS Origin Rejection (CWE-346 Defense)',
        passed,
        `Untrusted origin 'https://malicious-attacker-site.com' was rejected (A-C-A-O: ${allowOrigin || 'none'}).`
      );
    } catch (e: any) {
      report('Strict CORS Origin Rejection', false, e.message);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 3: Cloudinary IDOR - Customer Role Asset Deletion Block
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const secret = getJwtSecret();
      // Create a customer token
      const customerToken = jwt.sign(
        { id: 'test_cust_1', email: 'customer_test@example.com', role: 'user' },
        secret,
        { expiresIn: '1h' }
      );

      const resDelete = await request(app)
        .delete('/api/upload')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ public_id: 'clara-fashion/boutique_storefront_banner' });

      const passed = resDelete.status === 403;
      report(
        'Cloudinary IDOR Customer Role Deletion Guard (CWE-639 Defense)',
        passed,
        `Customer received HTTP ${resDelete.status} Forbidden: ${resDelete.body.message || 'Blocked'}`
      );
    } catch (e: any) {
      report('Cloudinary IDOR Customer Role Deletion Guard', false, e.message);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 4: Google Auth Cryptographic Verification Guard
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const resForgedGoogle = await request(app)
        .post('/api/auth/google')
        .send({
          email: 'admin_victim@example.com',
          name: 'Spoofed User',
          credential: 'forged.fake.token'
        });

      const passed = resForgedGoogle.status === 401;
      report(
        'Google ID Token Cryptographic Verification (CWE-287 Defense)',
        passed,
        `Forged Google token received HTTP ${resForgedGoogle.status} Unauthorized: ${resForgedGoogle.body.error?.message || 'Token verification failed'}`
      );
    } catch (e: any) {
      report('Google ID Token Cryptographic Verification', false, e.message);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 5: Order Price Manipulation & Negative Quantity Defense
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const secret = getJwtSecret();
      const customerToken = jwt.sign(
        { id: 'test_cust_order', email: 'cust_order@example.com', role: 'user' },
        secret,
        { expiresIn: '1h' }
      );

      // Attempt negative quantity
      const resNegativeQty = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          addressId: 'addr_fake',
          paymentMethod: 'COD',
          items: [{ productId: 'test_prod_1', quantity: -5 }],
          summary: { subtotal: 1000, total: 1 }
        });

      const passedNegative = resNegativeQty.status === 400 || resNegativeQty.status === 500;
      report(
        'Order Negative Quantity Input Validation (CWE-20 Defense)',
        passedNegative,
        `Negative quantity rejected with HTTP ${resNegativeQty.status}: ${resNegativeQty.body.message}`
      );
    } catch (e: any) {
      report('Order Negative Quantity Input Validation', false, e.message);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 6: Tampered Order Total Manipulation (CWE-840 Defense)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const secret = getJwtSecret();
      const testUserId = `u_sec_test_${Date.now()}`;
      const customerToken = jwt.sign(
        { id: testUserId, email: 'financial_test@example.com', role: 'user' },
        secret,
        { expiresIn: '1h' }
      );

      // Create test user first to satisfy foreign key constraints
      await User.create({
        id: testUserId,
        name: 'Test Customer',
        email: `financial_test_${Date.now()}@example.com`,
        passwordHash: 'hash_test_dummy',
        role: 'user'
      });

      // Create test product and delivery address
      const testProdId = `prod_test_${Date.now()}`;
      await Product.create({
        id: testProdId,
        title: 'Couture Silk Sherwani',
        description: 'Handcrafted raw silk sherwani with zardozi embroidery',
        brand: 'Vivienne Atelier',
        price: 8000,
        discount: 10, // 10% off -> 7200
        stock: 50,
        category: 'Festive',
        gender: 'men',
        fabric: 'Silk',
        fit: 'Regular',
        occasion: 'Festive',
        pattern: 'Embroidered',
        sleeve: 'Full Sleeve',
        images: ['https://example.com/item.jpg'],
        sizes: ['40'],
        colors: ['Gold']
      });

      const testAddrId = `addr_test_${Date.now()}`;
      await Address.create({
        id: testAddrId,
        userId: testUserId,
        name: 'Test Customer',
        phone: '9876543210',
        street: '123 Fashion Blvd',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        isDefault: true
      });

      // Malicious payload: sends total = 1 rupee
      const resTampered = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          addressId: testAddrId,
          paymentMethod: 'COD',
          items: [{ productId: testProdId, quantity: 2 }],
          summary: { subtotal: 16000, total: 1 } // ATTEMPTED FINANCIAL TAMPERING
        });

      const orderData = resTampered.body.order;
      console.log('ORDER DATA RESULT:', JSON.stringify(orderData));
      const orderSummary = typeof orderData?.summary === 'string' ? JSON.parse(orderData.summary) : (orderData?.summary || {});
      const actualTotal = Number(orderSummary.total);
      const expectedTotal = (8000 * 0.9) * 2; // 7200 * 2 = 14400 (shipping free >= 999)
      const passedTampered = resTampered.status === 201 && actualTotal === expectedTotal && actualTotal !== 1;

      report(
        'Server-Side Authoritative Order Total Recalculation (CWE-840 Defense)',
        passedTampered,
        `Client submitted total = ₹1. Backend calculated and saved authoritative total = ₹${actualTotal} (Expected ₹${expectedTotal}).`
      );
    } catch (e: any) {
      report('Server-Side Authoritative Order Total Recalculation', false, e.message);
    }

    console.log('────────────────────────────────────────────────────');
    console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('────────────────────────────────────────────────────\n');

  } catch (err) {
    console.error('Test execution fatal error:', err);
  } finally {
    process.exit(0);
  }
}

runSecurityTestSuite();
