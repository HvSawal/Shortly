import http from "k6/http";
import { check, sleep } from "k6";

const API_BASE = __ENV.API_BASE || "https://api.hsawal.com";
const GO_BASE  = __ENV.GO_BASE  || "https://go.hsawal.com";
const SHORTEN_PATH = __ENV.SHORTEN_PATH || "/api/v1/shorten"; // <-- change if needed

export const options = {
  vus: 1,
  duration: "15s",
  thresholds: {
    http_req_failed: ["rate<0.01"],          // <1% errors
    http_req_duration: ["p(95)<800"],        // 95% under 800ms (tune later)
  },
};

export default function () {
  // 1) Create
  const payload = JSON.stringify({
    url: "https://example.com",
    previewEnabled: false,
  });

  const res = http.post(`${API_BASE}${SHORTEN_PATH}`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "shorten" },
  });

  const okCreate = check(res, {
    "create status is 200/201": (r) => r.status === 200 || r.status === 201,
    "create returned json": (r) => r.headers["Content-Type"]?.includes("application/json"),
  });

  if (!okCreate) {
    // If it fails, don't cascade failures by trying redirect
    sleep(1);
    return;
  }

  const body = res.json();
  const code = body.code; // you return {"code":"_MsyRZ",...}

  check(code, { "code present": (c) => typeof c === "string" && c.length > 0 });

  // 2) Redirect
  const r2 = http.get(`${GO_BASE}/${code}`, {
    redirects: 0, // IMPORTANT: we want to measure redirect response itself
    tags: { name: "redirect" },
  });

  check(r2, {
    "redirect is 301/302": (r) => r.status === 301 || r.status === 302,
    "has Location header": (r) => !!r.headers["Location"],
  });

  sleep(0.2);
}
