# Deuxcerie — Frontend

E-commerce storefront for Deuxcerie, a Brazilian artisanal bakery. Built with Next.js, React, and TypeScript.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui, Base UI |
| Animations | Framer Motion |
| State | Zustand |
| Icons | Lucide React |
| Deployment | Fly.io (Docker, region: GRU) |

---

## Features

- **Product catalog** — Categories: cakes (bolo), tarts (torta), and add-ons (adicional)
- **Cart** — Client-side cart with customizable options per item (dough, flavor, add-ons, notes, reference photos)
- **Dual pricing** — PIX (5% discount) and credit card (5% surcharge), calculated automatically
- **Checkout** — Two payment methods:
  - **PIX** — displays QR code + copy-paste code inline
  - **Card** — redirects to a secure hosted checkout page
- **Order tracking** — Polls payment status after submission
- **WhatsApp button** — Fixed contact shortcut on all pages
- **Security headers** — CSP, HSTS, X-Frame-Options, and Permissions-Policy configured in `next.config.ts`

---

## Project Structure

```
app/
  layout.tsx              # Root layout (fonts, cart sidebar)
  page.tsx                # Home — product catalog and filtering
  payment/
    success/page.tsx      # Post-payment confirmation
    return/page.tsx       # Payment status polling page

components/
  cart/                   # CartSidebar, CartItem, CartButton, PixPaymentModal
  catalog/                # ProductGrid, ProductCard, CategoryTabs, AdditionalsOverlay
  ui/                     # Base UI primitives (Button)

lib/
  api.ts                  # API client (products, orders, payment sessions)
  utils.ts                # Utility helpers

store/
  cart.ts                 # Zustand cart store

types/
  index.ts                # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Environment Variables

Create a `.env.local` file at the root with these variables:

```env
NEXT_PUBLIC_API_URL=         # Backend API base URL
NEXT_PUBLIC_R2_BASE_URL=     # CDN base URL for product images
NEXT_PUBLIC_WHATSAPP_NUMBER= # WhatsApp contact number (digits only)
```

> Do **not** commit `.env.local` or `.env.production` to version control.

### Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Deployment

The project uses a multi-stage Dockerfile and deploys to [Fly.io](https://fly.io) in the `GRU` region (São Paulo).

```bash
bash deploy.sh
```

The `fly.toml` configuration enforces HTTPS and allocates a shared CPU with 512 MB RAM.

---

## API Integration

All API calls go through `lib/api.ts`. The backend URL is set via `NEXT_PUBLIC_API_URL`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/ecommerce/products` | Fetch product catalog |
| `POST` | `/api/v1/ecommerce/orders` | Submit order (multipart, includes photos) |
| `GET` | `/api/v1/ecommerce/checkout-sessions/:id/status` | Poll payment status |

The client includes retry logic with exponential backoff and handles rate-limiting (HTTP 429).

---

## Security

- **CSP** restricts script, style, image, and API origins
- **HSTS** enforced for 2 years including subdomains
- **X-Frame-Options: DENY** prevents clickjacking
- **Permissions-Policy** disables camera, microphone, geolocation, and payment APIs at the browser level
- Photo uploads are sent directly with the order payload — no separate upload endpoint exposed

---

## License

Private — all rights reserved by Deuxcerie.
