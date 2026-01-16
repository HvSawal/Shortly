import http from "k6/http";
import { check, sleep } from "k6";

const API_BASE = __ENV.API_BASE || "https://api.hsawal.com";
const GO_BASE  = __ENV.GO_BASE  || "https://go.hsawal.com";
const SHORTEN_PATH = __ENV.SHORTEN_PATH || "/api/v1/shorten";

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "60s", target: 25 },
    { duration: "60s", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1200"],
  },
};

export default function () {
  // Mix: 20% create, 80% redirect (typical prod pattern)
  const p = Math.random();

  if (p < 0.2) {
    const payload = JSON.stringify({ url: "https://example.com", previewEnabled: false });
    const res = http.post(`${API_BASE}${SHORTEN_PATH}`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "shorten" },
    });
    check(res, { "create ok": (r) => r.status === 200 || r.status === 201 });
  } else {
    // If you have a known code, test redirect hot-path consistently
    const code = __ENV.KNOWN_CODE || "_MsyRZ"; // set this to a valid existing code in your DB
    const r2 = http.get(`${GO_BASE}/${code}`, { redirects: 0, tags: { name: "redirect" } });
    check(r2, { "redirect ok": (r) => r.status === 301 || r.status === 302 });
  }

  sleep(0.1);
}
