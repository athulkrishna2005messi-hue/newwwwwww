# FeedbackFlow Web App

FeedbackFlow is a Next.js 14 application that showcases the customer feedback and product insight experience we are building. This scaffold includes the App Router, TypeScript, Tailwind CSS, and shared UI primitives to accelerate future feature development.

## Tech stack

- **Framework:** [Next.js 14](https://nextjs.org/) with the App Router and React Server Components
- **Language:** TypeScript
- **Styling:** Tailwind CSS with FeedbackFlow brand tokens
- **Tooling:** ESLint, Prettier, EditorConfig, and GitHub Actions CI

## Getting started

### Prerequisites

- Node.js ≥ 18.18.0
- pnpm, npm, or yarn (examples below use `npm`)

### Installation

```bash
npm install
```

### Environment variables

Copy the example environment file and populate it with your credentials:

```bash
cp .env.local.example .env.local
```

Update the values in `.env.local` to match your Hugging Face, Firebase, and Whop configuration. These same variables must be configured in the Vercel dashboard (or your secret manager of choice) before promoting a deployment to production.

| Variable | Required in production | Description |
| --- | --- | --- |
| `HUGGINGFACE_API_KEY` | ✅ | API token used to enrich feedback with Hugging Face models. |
| `HUGGINGFACE_INFERENCE_BASE_URL` | Optional | Override the default Hugging Face inference endpoint if you are using a private gateway. |
| `FIREBASE_API_KEY` | ✅ | Firebase web API key for authenticating requests. |
| `FIREBASE_AUTH_DOMAIN` | ✅ | Authentication domain for Firebase Auth. |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase project identifier. |
| `FIREBASE_STORAGE_BUCKET` | ✅ | Storage bucket for assets and attachments. |
| `FIREBASE_MESSAGING_SENDER_ID` | ✅ | Sender ID for Firebase Cloud Messaging. |
| `FIREBASE_APP_ID` | ✅ | Firebase application identifier. |
| `WHOP_CHECKOUT_URL` | ✅ | Checkout URL for monetized feature access via Whop. |
| `WHOP_API_TOKEN` | ✅ | Whop API token for server-side fulfillment flows. |

### Available scripts

```bash
npm run dev     # Start the development server
npm run build   # Build the production bundle
npm run lint    # Run ESLint checks
npm run test    # Placeholder test command
```

Visit `http://localhost:3000` to load the marketing landing page. Navigate to `/app/dashboard` for the dashboard experience protected by the auth gate placeholder.

## Project structure

```
app/                     # App Router routes
  (marketing)/page.tsx   # Public marketing landing page
  (app)/layout.tsx       # Authenticated application shell
  (app)/dashboard/       # Dashboard route
src/
  components/            # Shared UI building blocks
  styles/globals.css     # Tailwind layers and brand tokens
```

## Linting and formatting

ESLint and Prettier are preconfigured to match the project style guidelines. Most editors will respect `.editorconfig`, `.prettierrc`, and the workspace settings under `.vscode/`.

```bash
npm run lint
```

## Continuous integration

GitHub Actions runs linting and build checks on every push and pull request targeting the default branch. The workflow file is located at `.github/workflows/ci.yml`.

## Deployment

Vercel is the recommended hosting platform for FeedbackFlow. The included `vercel.json` configures the build step and reserves the Edge runtime for lightweight API routes when they are added.

### Production readiness checklist

- Run `npm run lint` and `next lint --experimental-lint` before merging to confirm accessibility and best-practice coverage.
- Exercise the loading states and error boundaries in staging so unexpected runtime issues surface before release.
- Confirm every environment variable listed above is populated in the Vercel dashboard (Project Settings → Environment Variables).
- Smoke test a staging deploy and verify error logs reach your monitoring destination (currently the console via the reporting hook).
- Capture Lighthouse scores for Performance, Accessibility, Best Practices, and SEO. Address any regressions prior to promoting a release.

### Deploying to Vercel

1. Create a new Vercel project and import this repository.
2. The default Next.js build command (`npm run build`) and output directory (`.next`) work out of the box.
3. Populate the Production, Preview, and Development environments using the variables outlined in the table above.
4. Trigger a deployment by pushing to your main branch or deploying manually from Vercel.
5. After the first deploy, confirm that Edge functions appear under **Functions → Regions** so future API routes automatically benefit from the configured runtime.

### Quota monitoring

- **Hugging Face**: Track inference usage and rate limits from the [Hugging Face dashboard](https://huggingface.co/settings/tokens). Configure alerts if you anticipate large spikes.
- **Firebase**: Monitor authentication, Firestore, and storage quotas in the Firebase console. Set budget alerts to avoid throttling.
- **Whop**: Review API request counts and fulfillment metrics from the Whop dashboard to make sure monetized flows remain healthy.

### Credential rotation

- Store all secrets in Vercel (or your preferred secret manager) and avoid committing them to the repository.
- When rotating keys, generate and apply the new value, trigger a redeploy, verify functionality, and then revoke the old credential.
- For Hugging Face tokens specifically, revoke unused keys from the dashboard to limit exposure.

---

Need help or have feedback? Contact the FeedbackFlow team at [hello@feedbackflow.io](mailto:hello@feedbackflow.io).
