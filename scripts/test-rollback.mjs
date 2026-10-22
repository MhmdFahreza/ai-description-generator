import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
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

const url = envVars.UPSTASH_REDIS_REST_URL;
const token = envVars.UPSTASH_REDIS_REST_TOKEN;

const redis = new Redis({ url, token });
const daily = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "86400 s"),
  prefix: "rl:daily",
  analytics: false,
});

async function test() {
  const visitorId = "test-rollback-" + Date.now();
  console.log("Testing visitor:", visitorId);

  // 1. Check initial
  const init = await daily.getRemaining(`visitor:${visitorId}`);
  console.log("Initial remaining:", init.remaining);

  // 2. Consume 1
  const consume = await daily.limit(`visitor:${visitorId}`);
  console.log("After consume remaining:", consume.remaining);

  // 3. Rollback via negative rate: { rate: -1 }
  try {
    const refund = await daily.limit(`visitor:${visitorId}`, { rate: -1 });
    console.log("After refund remaining (limit result):", refund.remaining);
  } catch (e) {
    console.error("Refund error:", e.message);
  }

  // 4. Verify via getRemaining
  const finalCheck = await daily.getRemaining(`visitor:${visitorId}`);
  console.log("Final check getRemaining:", finalCheck.remaining);
}

test().catch(console.error);
