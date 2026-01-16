import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const API_BASE = __ENV.API_BASE || "https://api.hsawal.com";
const SHORTEN_PATH = __ENV.SHORTEN_PATH || "/api/v1/shorten";
const TARGET_RPS = Number(__ENV.RPS || "2"); // start low

export const rateLimited = new Counter("rate_limited");

export const options = {
  scenarios: {
    shorten: {
      executor: "constant-arrival-rate",
      rate: TARGET_RPS,        // requests per timeUnit
      timeUnit: "1s",
      duration: "60s",
      preAllocatedVUs: 100,
      maxVUs: 300,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<150", "p(99)<300"],
    rate_limited: ["count<10"], // adjust as desired
  },
};

export default function () {
  const payload = JSON.stringify({ url: "https://example.com" });

  const res = http.post(`${API_BASE}${SHORTEN_PATH}`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "shorten" },
  });

  if (res.status === 429) {
    rateLimited.add(1);

    // Respect server guidance so we don't just slam the limiter endlessly
    const ra = parseInt(res.headers["Retry-After"] || "1", 10);
    sleep(Math.min(Math.max(ra, 1), 10)); // clamp 1..10s to keep test moving
    return;
  }

  check(res, { "status 200/201": (r) => r.status === 200 || r.status === 201 });
}
