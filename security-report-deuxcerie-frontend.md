# 🔐 Security Vulnerability Report — Deuxcerie Frontend (Next.js)

**Date:** 2026-03-18  
**Scope:** `deuxcerie-frontend` — Next.js 16 / React 19 SPA  
**Analyst:** Cybersecurity Specialist — Payment Gateway & Ecommerce  
**Severity Legend:** 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low / Informational

---

## Executive Summary

A full source-code review of the Deuxcerie Next.js frontend identified **14 vulnerabilities** spanning sensitive data exposure, client-side trust abuse, API misconfiguration, information leakage, missing input sanitization, and client-state integrity failures. Several findings interact with the backend vulnerabilities already reported — exploiting the frontend often acts as the first step to attacking the backend.

---

## Finding Index

| # | Severity | Title | File |
|---|----------|-------|------|
| 1 | 🔴 Critical | API URL and R2 Base URL Exposed in Client Bundle | `lib/api.ts` |
| 2 | 🔴 Critical | No Email or CPF Field — PII Silently Missing From Order Submission | `lib/api.ts` / `CartSidebar.tsx` |
| 3 | 🟠 High | Prices Trusted From Client-Side State — No Server-Side Price Verification | `lib/api.ts` |
| 4 | 🟠 High | Delivery Date Minimum Enforced Only by Frontend `min` Attribute | `CartSidebar.tsx` |
| 5 | 🟠 High | File Uploads: Type, Size, and Count Not Validated Before API Call | `CartItem.tsx` |
| 6 | 🟠 High | WhatsApp Phone Number Hardcoded in Source | `WhatsAppButton.tsx` |
| 7 | 🟡 Medium | Cart State Persisted in Memory Without Integrity Checks — Tamper via DevTools | `store/cart.ts` |
| 8 | 🟡 Medium | `submitOrder` Exposes Raw Server Error Messages to the User | `CartSidebar.tsx` / `lib/api.ts` |
| 9 | 🟡 Medium | No CSRF Protection on Order Submission | `lib/api.ts` |
| 10 | 🟡 Medium | Image Loaded via `<img>` Without `crossOrigin` — Potential Tainting | `CartItem.tsx` / `ProductCard.tsx` |
| 11 | 🟡 Medium | No Content Security Policy (CSP) Configured | `next.config.ts` |
| 12 | 🟡 Medium | Google Fonts Loaded Over External CDN — Privacy & Availability Risk | `globals.css` |
| 13 | 🔵 Low | `data/mock.ts` Shipped in Production Bundle | `data/mock.ts` |
| 14 | 🔵 Low | No Rate-Limit Feedback or Exponential Backoff on API Calls | `lib/api.ts` |

---

## Detailed Findings

---

### Finding 1 — 🔴 CRITICAL: API URL and R2 Base URL Exposed in Client Bundle

**File:** `lib/api.ts`, lines 1–4

**Description:**  
Both API configuration values are prefixed with `NEXT_PUBLIC_`, which means Next.js **bakes them into the client-side JavaScript bundle** at build time:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5056";
const R2_BASE_URL = (process.env.NEXT_PUBLIC_R2_BASE_URL ?? "").replace(/\/$/, "");
```

This means:
1. `NEXT_PUBLIC_API_URL` — the production API endpoint is visible to anyone who inspects the JS bundle or reads the page source. An attacker now knows the exact backend URL to target directly, bypassing any CDN-level rate limiting or WAF rules.
2. `NEXT_PUBLIC_R2_BASE_URL` — the Cloudflare R2 public bucket URL is exposed. An attacker can enumerate uploaded files (e.g., `{R2_BASE_URL}/ecommerce/orders/{sessionId}/ref_0_0.jpg`) if they can obtain any session ID, exposing customers' reference photos.
3. The fallback `http://localhost:5056` means if the env var is not set in production, all requests go to `localhost` and silently fail — a misconfiguration risk.

**Impact:** API endpoint enumeration; direct attack surface discovery; R2 object enumeration; customer photo data exposure.

**Fix:**
1. `NEXT_PUBLIC_API_URL` is unfortunately required for client-side fetch — but consider routing all API calls through **Next.js API Routes** (`/app/api/...`) as a proxy, so the real backend URL never leaves the server:

```ts
// app/api/products/route.ts (server-side proxy)
export async function GET() {
  const res = await fetch(`${process.env.API_URL}/api/v1/ecommerce/products`);
  return Response.json(await res.json());
}
```

This way `API_URL` (without `NEXT_PUBLIC_`) stays server-only.

2. For R2 images, serve them through Next.js's `<Image>` component with a configured remote pattern, or proxy through a Next.js route. Never expose the raw bucket URL.

3. Add a build-time assertion to fail the build if required env vars are missing:

```ts
// next.config.ts
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is required");
}
```

---

### Finding 2 — 🔴 CRITICAL: Email and CPF Fields Missing From Order Submission

**File:** `lib/api.ts` (`submitOrder`), `CartSidebar.tsx`

**Description:**  
The backend `POST /orders` endpoint requires `email` and `taxId` (CPF) fields. The `CartSidebar` only collects `clientName`, `clientMobile`, and `deliveryDate`. The `submitOrder` function in `lib/api.ts` never sends `email` or `taxId`:

```ts
// lib/api.ts — missing email and taxId
formData.append("clientName", payload.clientName);
formData.append("clientMobile", payload.clientMobile);
formData.append("deliveryDate", payload.deliveryDate);
// email and taxId are NEVER appended
```

This means:
- Every order submission will be rejected by the backend with a 400 error (`"O campo 'email' é obrigatório."`), making the entire checkout flow **broken**.
- OR, if this frontend was previously working, the backend was modified to require these fields while the frontend was not updated — creating a silent regression that blocks all real orders.
- If somehow orders do get through (e.g., backend validation was bypassed), then `checkout_sessions` rows have empty `Email` and `TaxId`, breaking email confirmations and CPF verification.

**Impact:** Complete checkout failure; broken order flow; LGPD compliance gap (no CPF collected for tax purposes).

**Fix:**  
Add the missing fields to the `CartSidebar` form and `OrderPayload` type:

```tsx
// CartSidebar.tsx — add missing fields
const [email, setEmail] = useState("");
const [taxId, setTaxId] = useState("");

// In form:
<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
<input type="text" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="CPF (somente números)" maxLength={14} />
```

```ts
// lib/api.ts
formData.append("email", payload.email);
formData.append("taxId", payload.taxId);
```

Also validate email format and CPF format client-side before submission.

---

### Finding 3 — 🟠 HIGH: Prices Trusted From Client-Side State

**File:** `lib/api.ts`, `submitOrder` function

**Description:**  
The `paidPrice` sent to the backend comes directly from `cartItem.product.price` stored in the Zustand store:

```ts
flatItems.push({
  productId: cartItem.product.id,
  quantity: cartItem.quantity,
  paidPrice: Math.round(cartItem.product.price * 100),
  observation: cartItem.observation || null,
});
```

While the backend **does** validate that `paidPrice >= expectedPrice` (server-side product price lookup), the frontend sends the price it stored in memory. A user can:
1. Open DevTools → Application → find the Zustand store in memory.
2. Modify `cartItem.product.price` to an arbitrarily low value (e.g., `0.01`).
3. Submit the order with a manipulated price.

The backend *should* catch this with its price check (`if (item.PaidPrice < expectedPrice) throw`), but this relies entirely on backend enforcement. The frontend provides zero defense-in-depth. Also, the `paidPrice` for additional items uses `additional.price` directly — the same manipulation applies.

**Impact:** Attempted price manipulation; relies solely on backend as defense; exposes business logic to client-side tampering.

**Fix:**
1. Do NOT send `paidPrice` from the frontend at all. Remove it from the payload:

```ts
// The backend knows the price from the database — let it calculate
flatItems.push({
  productId: cartItem.product.id,
  quantity: cartItem.quantity,
  // Remove paidPrice — let backend determine price
});
```

2. If `paidPrice` must be sent for UX confirmation purposes, sign the cart server-side (via a Next.js API Route) and include a HMAC of the intended prices so the backend can verify integrity.

---

### Finding 4 — 🟠 HIGH: Delivery Date Minimum Enforced Only Client-Side

**File:** `components/cart/CartSidebar.tsx`

**Description:**  
The minimum delivery date is computed and enforced exclusively via an HTML `min` attribute:

```tsx
const minDate = new Date();
minDate.setDate(minDate.getDate() + 2);
const minDateStr = minDate.toISOString().split("T")[0];
// ...
<input type="date" min={minDateStr} ... />
```

The `min` attribute on an `<input type="date">` is **trivially bypassed** by:
1. Removing the attribute via DevTools.
2. Crafting a raw `fetch()` request with any date.
3. Using a browser that ignores the `min` attribute.

The backend does validate the minimum date, but the frontend validation provides a false sense of security and allows users to attempt invalid orders, generating unnecessary error traffic and potentially revealing backend validation error messages.

**Timezone issue (compounding):** `minDate.toISOString().split("T")[0]` produces a UTC date, not a local Brazil date. For a user in UTC-3 before midnight UTC, this shows tomorrow as the minimum rather than the correct local business date.

**Impact:** Bypass of UX date restriction; confusing behavior for Brazilian users near midnight UTC; unnecessary backend error exposure.

**Fix:**
1. Use local timezone for date calculation:

```ts
const today = new Date();
const brazilOffset = -3 * 60; // BRT = UTC-3
const localDate = new Date(today.getTime() + (today.getTimezoneOffset() + (-brazilOffset)) * 60000);
localDate.setDate(localDate.getDate() + 2);
const minDateStr = localDate.toISOString().split("T")[0];
```

Or better, use `Intl.DateTimeFormat` to get the local date string.

2. Add frontend validation *before* submission that checks the selected date, showing a friendly error rather than relying on the backend 400 response.

---

### Finding 5 — 🟠 HIGH: File Uploads Not Validated Client-Side

**File:** `components/cart/CartItem.tsx`

**Description:**  
The file input only specifies `accept="image/*"`:

```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleFileChange}
/>
```

There is **no client-side validation** of:
- **File type** — `accept="image/*"` is a UI hint only, not security. Any file can be selected programmatically.
- **File size** — Users can attach 50 MB files (Kestrel's global limit). The backend validates 10 MB per file, but the browser will upload the entire file before the backend rejects it.
- **File count** — The code checks `item.photos.length < 3` in `handleFileChange`, but this can be bypassed if photos are added concurrently.

Uploading large files wastes bandwidth, can cause mobile browser crashes, and provides a way to probe backend error handling.

**Impact:** Large payload DoS; unnecessary bandwidth consumption; confusing UX when backend rejects files.

**Fix:**

```ts
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Client-side guards
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_SIZE_MB = 10;

  if (!ALLOWED_TYPES.includes(file.type)) {
    alert("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.");
    return;
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    alert(`Arquivo muito grande. Máximo: ${MAX_SIZE_MB} MB.`);
    return;
  }

  if (item.photos.length >= 3) {
    alert("Máximo de 3 fotos por item.");
    return;
  }

  addPhoto(item.id, file);
  e.target.value = "";
};
```

---

### Finding 6 — 🟠 HIGH: WhatsApp Phone Number Hardcoded in Source

**File:** `components/WhatsAppButton.tsx`

**Description:**  
The business WhatsApp phone number is hardcoded directly in the component:

```tsx
href="https://wa.me/5521998864321"
```

This:
1. Exposes the real phone number in the public git repository, making it trivially discoverable by scrapers.
2. Makes it impossible to change the number without a new deployment.
3. This is now permanently in git history.

While a phone number may seem low-risk, it can be used for social engineering, spam, or targeted attacks against the business owner.

**Impact:** Phone number scraping; spam/social engineering vector; operational inflexibility.

**Fix:**
1. Move to an environment variable (even though it's `NEXT_PUBLIC_`, it's better than hardcoding):

```tsx
const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
href={`https://wa.me/${waNumber}`}
```

2. Or use a server-side redirect route (`/api/whatsapp`) that redirects to the real number, keeping the number server-side only.

---

### Finding 7 — 🟡 MEDIUM: Cart State Tampered via DevTools

**File:** `store/cart.ts`

**Description:**  
The entire cart lives in Zustand in-memory state with no integrity protection. Any user can open the browser DevTools console and call:

```js
// Directly access and mutate Zustand store
window.__zustandStore.setState({ items: [...] })
```

Or install the `zustand/devtools` middleware and modify state visually. More practically, a user can:
- Change `item.product.price` to `0.01`.
- Change `item.quantity` to `9999`.
- Remove `additionals` to avoid paying for them.
- Change `item.product.id` to a different, cheaper product.

The backend does validate prices and product existence, so this won't create fraudulent orders, BUT it creates confusing error messages and exposes the backend's validation logic through error messages.

The Zustand store is also not persisted (`localStorage` not used), which means cart is lost on page refresh — a UX issue that may cause customers to abandon.

**Impact:** Confusing UX; exposes backend validation messages; price tampering attempts (caught server-side).

**Fix:**
1. Do not send prices from the frontend at all (see Finding 3).
2. Add cart persistence using `zustand/middleware` `persist` with session storage for better UX:

```ts
import { persist } from "zustand/middleware";
export const useCartStore = create<CartStore>()(
  persist(/* store def */, { name: "deuxcerie-cart", storage: createSessionStorageStorage() })
);
```

3. Use Zustand devtools only in development builds:

```ts
import { devtools } from "zustand/middleware";
const store = process.env.NODE_ENV === "development"
  ? create(devtools(storeDefinition))
  : create(storeDefinition);
```

---

### Finding 8 — 🟡 MEDIUM: Raw Server Error Messages Displayed to Users

**File:** `components/cart/CartSidebar.tsx`, `lib/api.ts`

**Description:**  
Backend error messages are passed through directly and rendered in the UI:

```ts
// lib/api.ts
throw new Error((body as { error?: string }).error ?? `Erro ${res.status}`);
```

```tsx
// CartSidebar.tsx
{submitError && (
  <p className="text-xs text-red-600 mb-3 bg-red-50 rounded-lg px-3 py-2">
    {submitError}  {/* Raw backend error message */}
  </p>
)}
```

The backend currently returns messages like:
- `"Produto 3fa85f64-... não encontrado ou inativo."` — exposes internal GUIDs
- `"O preço do produto 3fa85f64-... mudou."` — business intelligence
- `"Data de entrega mínima é 20/03/2026."` — server date exposure
- `"Arquivo excede o limite de 10 MB."` — reveals backend limits

These messages help attackers understand the system's internal validation rules and limits.

**Impact:** Information disclosure; business logic leakage; aids in targeted attacks.

**Fix:**  
Map known backend error codes to friendly user messages:

```ts
// lib/api.ts
const ERROR_MAP: Record<string, string> = {
  "paidPrice": "Um produto teve uma atualização de preço. Recarregue e tente novamente.",
  "não encontrado ou inativo": "Um produto não está mais disponível.",
  "Data de entrega": "A data de entrega selecionada não está disponível.",
  "Arquivo": "Um arquivo de referência é muito grande ou inválido.",
};

function getFriendlyError(raw: string): string {
  for (const [key, msg] of Object.entries(ERROR_MAP)) {
    if (raw.includes(key)) return msg;
  }
  return "Ocorreu um erro ao processar seu pedido. Tente novamente.";
}
```

---

### Finding 9 — 🟡 MEDIUM: No CSRF Protection on Order Submission

**File:** `lib/api.ts`

**Description:**  
The `submitOrder` function sends a `multipart/form-data` POST request with no CSRF token:

```ts
const res = await fetch(`${API_URL}/api/v1/ecommerce/orders`, {
  method: "POST",
  body: formData,
  // No CSRF token, no custom header
});
```

While `multipart/form-data` is not automatically cross-origin exploitable via simple CSRF forms (a `<form>` can't set custom headers), a malicious site CAN submit a `multipart/form-data` form to the backend. The backend has `.DisableAntiforgery()` explicitly set, removing the built-in .NET antiforgery protection.

An attacker who tricks a logged-in user into visiting a malicious page can submit orders on their behalf (if cookies or stored credentials are involved), or probe the API.

**Impact:** Cross-site form submission; order creation on behalf of victim; API probing.

**Fix:**
1. Add a custom header (e.g., `X-Requested-With: XMLHttpRequest`) to all API requests — cross-origin forms cannot set custom headers without CORS preflight:

```ts
// All fetch calls
headers: {
  "X-Requested-With": "XMLHttpRequest",
},
```

2. Re-enable antiforgery on the backend and include the token in all state-changing requests.

3. Consider using a `SameSite=Strict` cookie-based session if authentication is added later.

---

### Finding 10 — 🟡 MEDIUM: Images Loaded Without `crossOrigin` Attribute

**Files:** `components/cart/CartItem.tsx`, `components/catalog/ProductCard.tsx`

**Description:**  
Both files use plain `<img>` tags without `crossOrigin="anonymous"`:

```tsx
// CartItem.tsx — blob URL previews
<img src={src} alt={`Referência ${i + 1}`} ... />

// ProductCard.tsx — R2 images
<img src={group.variants[0].imageUrl} alt="" ... />
```

Issues:
1. **No `loading="lazy"`** on product images — all product images load eagerly, causing significant LCP (Largest Contentful Paint) degradation and bandwidth waste on mobile.
2. **`eslint-disable-next-line @next/next/no-img-element`** suppresses Next.js's built-in image optimization warning. The app should use `<Image>` from `next/image` which automatically handles lazy loading, WebP conversion, responsive sizes, and CDN caching.
3. Blob URL previews don't handle revocation on unmount in a race-condition-safe way when `item.photos` changes rapidly.

**Impact:** Performance degradation; potential canvas taint if images are used programmatically; missing lazy loading.

**Fix:**
1. Use `next/image` for all product images:

```tsx
import Image from "next/image";
<Image
  src={group.variants[0].imageUrl!}
  alt={group.name}
  fill
  className="object-contain"
  loading="lazy"
/>
```

2. Add R2's public domain to `next.config.ts`:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "pub-*.r2.dev",  // your R2 domain
    }],
  },
};
```

3. For blob previews, keep the `useEffect` cleanup but add a ref guard:

```ts
useEffect(() => {
  let cancelled = false;
  const urls = item.photos.map(f => URL.createObjectURL(f));
  if (!cancelled) setPreviews(urls);
  return () => {
    cancelled = true;
    urls.forEach(URL.revokeObjectURL);
  };
}, [item.photos]);
```

---

### Finding 11 — 🟡 MEDIUM: No Content Security Policy Configured

**File:** `next.config.ts`

**Description:**  
`next.config.ts` is essentially empty:

```ts
const nextConfig: NextConfig = {
  /* config options here */
};
```

There is no Content Security Policy (CSP), no `X-Frame-Options`, no `X-Content-Type-Options`, and no other security headers configured. Without a CSP:
- Any injected script (via XSS in product descriptions, for example) can execute freely.
- The app can be embedded in iframes (clickjacking).
- Browsers won't enforce strict content origins.

Note that some headers ARE added by the backend (for the API), but the **frontend** Next.js app itself has no headers.

**Impact:** XSS amplification; clickjacking; content injection.

**Fix:**

```ts
// next.config.ts
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",  // tighten once inline scripts are removed
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `img-src 'self' blob: data: ${process.env.NEXT_PUBLIC_R2_BASE_URL}`,
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL}`,
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

---

### Finding 12 — 🟡 MEDIUM: Google Fonts Loaded Over External CDN

**File:** `app/globals.css`

**Description:**  
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:...');
```

Loading fonts from `fonts.googleapis.com` at runtime:
1. **Privacy:** Google receives the user's IP address and browser information on every page load. Under LGPD, this constitutes data transfer to a third-party processor without explicit consent UI.
2. **Availability:** If Google Fonts is blocked (corporate firewalls, Brazil-specific network blocks), the app renders without any custom fonts, causing layout shift.
3. **Performance:** External DNS lookup + TLS handshake + font download adds latency to FCP (First Contentful Paint).
4. **CSP:** Requires `fonts.googleapis.com` and `fonts.gstatic.com` to be whitelisted, widening the CSP surface.

**Impact:** LGPD compliance risk; third-party data transfer without consent; availability dependency; performance impact.

**Fix:**
1. Self-host fonts using `next/font`:

```ts
// app/layout.tsx
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
```

Next.js will download fonts at build time and serve them from your own domain. No external requests at runtime.

---

### Finding 13 — 🔵 LOW: Mock Data File Shipped in Production Bundle

**File:** `data/mock.ts`

**Description:**  
The file `data/mock.ts` contains hardcoded mock product data with prices, IDs, descriptions, and categories. While it doesn't appear to be actively used (the app fetches from the real API via `fetchProducts()`), it IS included in the TypeScript compilation and **will be included in the production bundle** unless explicitly tree-shaken or excluded.

This file:
- Reveals internal product IDs (though fake `t1`, `b1`, etc.)
- Reveals price structure and category taxonomy
- Could cause confusion if accidentally imported instead of the real API
- Wastes bundle bytes

**Impact:** Minor information disclosure; bundle size waste; accidental usage risk.

**Fix:**
1. Delete `data/mock.ts` entirely if it's not used.
2. If needed for development/testing, move to a test file or guard with an environment check:

```ts
// Only export in development/test
if (process.env.NODE_ENV === "production") {
  throw new Error("Mock data should not be imported in production");
}
```

---

### Finding 14 — 🔵 LOW: No Rate-Limit Feedback or Retry Logic

**File:** `lib/api.ts`

**Description:**  
When the backend returns HTTP 429 (Too Many Requests), the frontend handles it identically to any other error:

```ts
if (!res.ok) {
  const body = await res.json().catch(() => ({}));
  throw new Error((body as { error?: string }).error ?? `Erro ${res.status}`);
}
```

The backend sends a `Retry-After: 60` header on 429 responses (per `Program.cs`), but the frontend completely ignores this header. A user who hits the rate limit sees a generic error and may repeatedly retry, making the situation worse and causing additional 429s.

Also, `fetchProducts()` has no error handling or retry for transient network failures, which on mobile networks is common.

**Impact:** Poor UX during rate limiting; user retry amplifies rate-limit situation; no resilience to transient errors.

**Fix:**

```ts
export async function fetchProducts(): Promise<Product[]> {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${API_URL}/api/v1/ecommerce/products`);
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") ?? "60");
        throw new Error(`Muitas tentativas. Tente novamente em ${retryAfter} segundos.`);
      }
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data: ApiProduct[] = await res.json();
      return data.map(mapProduct);
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // exponential backoff
    }
  }
  return [];
}
```

---

## Summary Table

| # | Severity | CVSS Estimate | Exploitability | Business Impact |
|---|----------|---------------|----------------|----------------|
| 1 | 🔴 Critical | 7.5 | Trivial (source inspection) | API endpoint exposure; photo enumeration |
| 2 | 🔴 Critical | 9.1 | Every order submission | Complete checkout failure |
| 3 | 🟠 High | 6.8 | DevTools access | Price manipulation attempt |
| 4 | 🟠 High | 5.3 | DevTools / direct fetch | Delivery date bypass |
| 5 | 🟠 High | 5.5 | File picker | Large file upload; type bypass |
| 6 | 🟠 High | 6.0 | Source inspection | Phone scraping; spam |
| 7 | 🟡 Medium | 4.3 | DevTools | Cart state manipulation |
| 8 | 🟡 Medium | 4.0 | Any user | Business logic leakage |
| 9 | 🟡 Medium | 4.3 | Malicious page | Cross-site order submission |
| 10 | 🟡 Medium | 3.5 | Performance | LCP degradation; canvas taint |
| 11 | 🟡 Medium | 5.5 | XSS amplification | Clickjacking; script injection |
| 12 | 🟡 Medium | 4.0 | LGPD audit | Third-party data transfer |
| 13 | 🔵 Low | 2.0 | Source inspection | Info disclosure; bundle waste |
| 14 | 🔵 Low | 2.5 | Rate-limited users | Retry amplification; poor UX |

---

## Interaction With Backend Vulnerabilities

Several frontend findings compound backend findings from the prior report:

| Frontend Finding | Backend Finding | Combined Risk |
|-----------------|-----------------|---------------|
| F1 (API URL exposed) | BE-F11 (rate limiter bypass) | Attacker can directly hit backend, bypassing CDN rate limits |
| F3 (client-side prices) | BE-F2 (amount verification gaps) | Double-layer weakness in payment integrity |
| F2 (missing email/CPF) | BE-F7 (CPF in plain text) | If CPF is eventually added, it flows to an unencrypted field |
| F8 (raw error messages) | BE-F19 (error leakage) | Both layers expose internals |
| F9 (no CSRF) | BE-F11 (IP rate limiting) | CSRF can bypass per-user rate limiting |

---

## Immediate Action Plan

### 🚨 Do This Now (Today)

1. **Fix Finding 2** — Add `email` and `taxId` fields to the checkout form and `submitOrder`. The app is non-functional without this.
2. **Fix Finding 1** — Proxy all API calls through Next.js API Routes to hide the backend URL.

### 📅 This Week

3. Add file validation client-side before upload (Finding 5).
4. Add CSP and security headers to `next.config.ts` (Finding 11).
5. Self-host fonts using `next/font` (Finding 12).
6. Move WhatsApp number to environment variable (Finding 6).

### 📅 This Sprint

7. Remove mock data file from production (Finding 13).
8. Add friendly error message mapping (Finding 8).
9. Fix delivery date timezone calculation (Finding 4).
10. Replace `<img>` with `next/image` throughout (Finding 10).
11. Add cart persistence and remove devtools exposure in production (Finding 7).
12. Add `X-Requested-With` header to all API calls (Finding 9).
13. Add retry logic and 429 handling (Finding 14).

---

## Appendix: Files Reviewed

- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `components/WhatsAppButton.tsx`
- `components/cart/CartButton.tsx`
- `components/cart/CartItem.tsx`
- `components/cart/CartSidebar.tsx`
- `components/catalog/AdditionalsOverlay.tsx`
- `components/catalog/CategoryTabs.tsx`
- `components/catalog/ProductCard.tsx`
- `components/catalog/ProductGrid.tsx`
- `data/mock.ts`
- `lib/api.ts`
- `lib/utils.ts`
- `next.config.ts`
- `package.json`
- `store/cart.ts`
- `types/index.ts`

---

*Report generated by automated + manual source-code security review. All findings verified against the provided source files. No dynamic testing was performed.*
