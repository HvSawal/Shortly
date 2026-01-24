import http from "k6/http";
import { check, sleep } from "k6";

const GO_BASE = (__ENV.GO_BASE || "https://go.hsawal.com").replace(/\/+$/, "");
const RPS = Number(__ENV.RPS || "1000");
const DURATION = __ENV.DURATION || "60s";
const CODES = (__ENV.CODES || "_MsyRZ").split(",").map((s) => s.trim()).filter(Boolean);
const PREFIX = (__ENV.REDIRECT_PREFIX || "").replace(/\/+$/, ""); // e.g. "" or "/r"

function pickCode() {
  return CODES[Math.floor(Math.random() * CODES.length)];
}

export const options = {
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
  scenarios: {
    redirect: {
      executor: "constant-arrival-rate",
      rate: RPS,
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: Number(__ENV.PRE_VUS || "100"),
      maxVUs: Number(__ENV.MAX_VUS || "1000"),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<150", "p(99)<300"],
  },
};

export default function () {
  const code = pickCode();
  const url = `${GO_BASE}${PREFIX}/${code}`;

  const res = http.get(url, { redirects: 0, tags: { name: "redirect" } });

  check(res, {
    "redirect 301/302": (r) => r.status === 301 || r.status === 302,
    "has Location": (r) => !!r.headers["Location"],
  });

  sleep(0.001);
}
