import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

// Treat 429 as "expected" for reporting
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 429));

const API_BASE = (__ENV.API_BASE || "https://api.hsawal.com").replace(/\/+$/, "");
const GO_BASE = (__ENV.GO_BASE || "https://go.hsawal.com").replace(/\/+$/, "");
const SHORTEN_PATH = (__ENV.SHORTEN_PATH || "/api/v1/shorten");
const CODES = (__ENV.CODES || "_MsyRZ").split(",").map((s) => s.trim()).filter(Boolean);
const PREFIX = (__ENV.REDIRECT_PREFIX || "").replace(/\/+$/, "");

const UNIQUE_URL = (__ENV.UNIQUE_URL || "0") === "1";

export const rateLimitedCount = new Counter("rate_limited");
export const rateLimitedRate = new Rate("rate_limited_rate");

function pickCode() {
  return CODES[Math.floor(Math.random() * CODES.length)];
}

export const options = {
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
  scenarios: {
    redirect: {
      executor: "constant-arrival-rate",
      exec: "redirect",
      rate: Number(__ENV.REDIRECT_RPS || "1000"),
      timeUnit: "1s",
      duration: __ENV.DURATION || "60s",
      preAllocatedVUs: Number(__ENV.REDIRECT_PRE_VUS || "200"),
      maxVUs: Number(__ENV.REDIRECT_MAX_VUS || "2000"),
    },
    shorten: {
      executor: "constant-arrival-rate",
      exec: "shorten",
      rate: Number(__ENV.SHORTEN_RPS || "20"),
      timeUnit: "1s",
      duration: __ENV.DURATION || "60s",
      preAllocatedVUs: Number(__ENV.SHORTEN_PRE_VUS || "50"),
      maxVUs: Number(__ENV.SHORTEN_MAX_VUS || "500"),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<150", "p(99)<300"],
    rate_limited_rate: ["rate<0.01"], // <1% throttled overall
  },
};

export function redirect() {
  const code = pickCode();
  const url = `${GO_BASE}${PREFIX}/${code}`;

  const res = http.get(url, { redirects: 0, tags: { name: "redirect" } });

  check(res, {
    "redirect 301/302": (r) => r.status === 301 || r.status === 302,
    "has Location": (r) => !!r.headers["Location"],
  });

  sleep(0.001);
}

export function shorten() {
  const baseUrl = "https://example.com";
  const url = UNIQUE_URL ? `${baseUrl}?v=${__VU}-${__ITER}-${Date.now()}` : baseUrl;

  const payload = JSON.stringify({ url });

  const res = http.post(`${API_BASE}${SHORTEN_PATH}`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "shorten" },
  });

  const is429 = res.status === 429;
  rateLimitedRate.add(is429);
  if (is429) rateLimitedCount.add(1);

  check(res, {
    "shorten 200/201 (or 429 if enabled)": (r) =>
      r.status === 200 || r.status === 201 || r.status === 429,
  });

  sleep(0.001);
}