import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

const envContent = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
const envVars = Object.fromEntries(
  envContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const secret =
  envVars.APP_SECRET ||
  envVars.UPSTASH_REDIS_REST_TOKEN ||
  envVars.GROQ_API_KEY ||
  "aidg-cookie-signing-secret-default";

function signVisitorId(uuid) {
  const hmac = createHmac("sha256", secret).update(uuid).digest("hex").slice(0, 32);
  return `${uuid}.${hmac}`;
}

async function testLiveServer() {
  console.log("=== RUNNING LIVE REMEDIATION TESTS ON DEV SERVER ===\n");
  const BASE_URL = "http://localhost:3000";
  let passed = 0;
  let failed = 0;

  // Test 1: Quota check returns signed cookie
  console.log("Test 1: GET /api/generate/quota returns signed aidg_vid cookie");
  try {
    const quotaRes = await fetch(`${BASE_URL}/api/generate/quota`);
    const setCookie = quotaRes.headers.get("set-cookie") || "";
    console.log("  Set-Cookie header:", setCookie.slice(0, 70) + "...");
    const match = setCookie.match(/aidg_vid=([a-f0-9\-]+\.[a-f0-9]{32})/);
    if (match) {
      console.log("  ✓ Server set valid HMAC-signed cookie:", match[1]);
      passed++;
    } else {
      console.error("  ✗ Expected signed aidg_vid cookie in set-cookie header");
      failed++;
    }
  } catch (err) {
    console.error("  ✗ Request error:", err.message);
    failed++;
  }

  // Test 2: Cross-Origin / CSRF rejection
  console.log("\nTest 2: Cross-origin request with hostile Origin -> Should return 403 Forbidden");
  try {
    const crossRes = await fetch(`${BASE_URL}/api/generate/product-description`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://malicious-website.com",
      },
      body: JSON.stringify({
        productName: "Sneakers",
        idea: "Cool running shoes",
      }),
    });
    console.log("  Response status:", crossRes.status);
    if (crossRes.status === 403) {
      console.log("  ✓ Hostile cross-origin POST blocked with HTTP 403");
      passed++;
    } else {
      console.error("  ✗ Expected 403, got:", crossRes.status);
      failed++;
    }
  } catch (err) {
    console.error("  ✗ Request error:", err.message);
    failed++;
  }

  // Test 3: Payload Too Large (> 50KB)
  console.log("\nTest 3: Payload > 50KB -> Should return 413 Payload Too Large");
  try {
    const largeBody = JSON.stringify({
      productName: "Big Product",
      idea: "A".repeat(60 * 1024), // 60KB
    });
    const largeRes = await fetch(`${BASE_URL}/api/generate/product-description`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(Buffer.byteLength(largeBody)),
      },
      body: largeBody,
    });
    console.log("  Response status:", largeRes.status);
    if (largeRes.status === 413) {
      console.log("  ✓ Payload > 50KB blocked with HTTP 413");
      passed++;
    } else {
      console.error("  ✗ Expected 413, got:", largeRes.status);
      failed++;
    }
  } catch (err) {
    console.error("  ✗ Request error:", err.message);
    failed++;
  }

  // Test 4: Forged unsigned cookie is rejected and replaced by server with signed cookie
  console.log("\nTest 4: Request with fake unsigned UUID cookie -> Server must reject fake ID and issue signed ID");
  try {
    const fakeUuid = "11111111-1111-4111-8111-111111111111"; // Unsigned
    const forgedRes = await fetch(`${BASE_URL}/api/generate/quota`, {
      headers: {
        Cookie: `aidg_vid=${fakeUuid}`,
      },
    });
    const setCookie = forgedRes.headers.get("set-cookie") || "";
    // Because fakeUuid has no signature, server must treat it as invalid/legacy or issue signed cookie
    const hasSigned = setCookie.includes("aidg_vid=") && setCookie.includes(".");
    if (hasSigned) {
      console.log("  ✓ Fake/unsigned cookie was sanitized and re-signed by server");
      passed++;
    } else {
      console.error("  ✗ Expected server to replace/sign cookie");
      failed++;
    }
  } catch (err) {
    console.error("  ✗ Request error:", err.message);
    failed++;
  }

  // Test 5: Successful AI generation with valid signed cookie
  console.log("\nTest 5: Valid generation request with signed cookie -> Should succeed and consume quota properly");
  try {
    const validUuid = "99999999-9999-4999-8999-999999999999";
    const signedCookie = signVisitorId(validUuid);
    const genRes = await fetch(`${BASE_URL}/api/generate/hook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `aidg_vid=${signedCookie}`,
      },
      body: JSON.stringify({
        topic: "Produktivitas",
        description: "Tips manajemen waktu untuk pekerja kantoran",
        style: "question",
        platform: "tiktok",
      }),
    });
    console.log("  Generation status:", genRes.status);
    if (genRes.ok) {
      const data = await genRes.json();
      console.log("  Sample generated hook:", data.hooks?.[0]);
      console.log("  Remaining quota header:", genRes.headers.get("X-RateLimit-Remaining-Daily"));
      console.log("  ✓ Generator succeeded with valid signed cookie");
      passed++;
    } else {
      console.error("  ✗ Generation failed:", genRes.status);
      failed++;
    }
  } catch (err) {
    console.error("  ✗ Request error:", err.message);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`LIVE SERVER TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) process.exit(1);
}

testLiveServer();
