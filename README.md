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

Update the values in `.env.local` to match your Hugging Face, Firebase, and Whop configuration. The scaffold does not yet consume these variables directly, but they will be required as integrations are implemented.

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

Vercel is the recommended hosting platform for FeedbackFlow.

1. Create a new Vercel project and import this repository.
2. Set the build command to `npm run build` and the output directory to `.next` (default for Next.js projects).
3. Configure the environment variables from `.env.local` in the Vercel dashboard.
4. Trigger a deployment by pushing to your main branch or deploying manually from Vercel.

For production, enable [Vercel’s Next.js caching and image optimization](https://vercel.com/docs/frameworks/nextjs) features to maximize performance.

---

Need help or have feedback? Contact the FeedbackFlow team at [hello@feedbackflow.io](mailto:hello@feedbackflow.io).
