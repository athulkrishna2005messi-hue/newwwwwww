# Firebase Core Starter

This repository bootstraps a Next.js App Router project with Firebase Authentication and Firestore. It includes:

- Client and server helpers for initializing the Firebase SDK with strongly validated environment variables.
- React context + hooks to expose Firebase Authentication throughout the application, with support for passwordless email link sign-in and an anonymous fallback mode for rapid onboarding.
- Typed Firestore collection contracts for `users`, `feedback`, `analyses`, and `kb` documents.
- Default Firestore security rules that scope reads and writes to the authenticated user while allowing read-only access to explicitly public knowledge base entries.
- A minimal onboarding flow at `/sign-in` that sends email magic links or provisions an anonymous user, ensuring a `users/{uid}` document is created with default quotas once the session is established.

## Prerequisites

- Node.js 18 or newer (matches the Next.js 14 runtime requirements)
- npm 9+
- A Firebase project with Firestore enabled
- Firebase CLI (`npm install -g firebase-tools`)

## Getting started

```bash
npm install
npm run dev
```

The development server runs on [http://localhost:3000](http://localhost:3000). All authentication state is persisted via the `AuthProvider` context defined in `src/components/AuthProvider.tsx`.

## Environment variables

Create an `.env.local` file at the repository root and populate every variable listed below. Client-side variables must start with `NEXT_PUBLIC_` so that Next.js can safely expose them to the browser. Server utilities fall back to the public values, but you can optionally provide private duplicates without the prefix if you prefer to keep server-side usage isolated.

```bash
# Client / browser configuration (required)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
# Optional analytics support
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# URL the email link should redirect to after the user clicks it
NEXT_PUBLIC_FIREBASE_EMAIL_LINK_REDIRECT=http://localhost:3000/sign-in

# Optional: private duplicates consumed by server utilities (fallbacks to the public values above if omitted)
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
```

> **Tip:** `NEXT_PUBLIC_FIREBASE_EMAIL_LINK_REDIRECT` should point to the sign-in route (e.g. `https://your-domain.com/sign-in`). Firebase requires the domain to be whitelisted under **Authentication › Settings › Authorized domains** in the Firebase console.

## Firebase Authentication configuration

1. Navigate to **Firebase Console → Authentication → Sign-in method**.
2. Enable **Email/Password** and set the mode to **Email link (passwordless sign-in)**. Configure the action URL to the same value you used for `NEXT_PUBLIC_FIREBASE_EMAIL_LINK_REDIRECT`.
3. Enable the **Anonymous** provider to allow guest sessions.
4. (Optional) Add any OAuth providers you plan to support later. The current implementation maps non-email link providers to the generic `oauth` type in the Firestore user profile.

When a user authenticates (email link or anonymous), `useFirebaseAuth` ensures a corresponding `users/{uid}` document is created with default quota values:

```ts
quotas: {
  analyses: 5,
  feedback: 20,
  knowledgeBase: 3,
}
```

These values can be adjusted in `src/types/firestore.ts` if your business logic evolves.

## Firestore data model

Types for every core collection live in `src/types/firestore.ts` and are shared across client utilities:

| Collection | Type | Notes |
|------------|------|-------|
| `users`    | `UserDocument` | Provisioned for every authenticated user with quotas and auth provider metadata. |
| `feedback` | `FeedbackDocument` | Stores per-user feedback items (scoped by `userId`). |
| `analyses` | `AnalysisDocument` | Tracks AI analysis requests/results per user. |
| `kb`       | `KnowledgeBaseDocument` | Knowledge base entries with `visibility` for public vs. private sharing. |

All non-user collections include a `userId` field so that security rules can enforce per-user access.

## Firestore security rules

Security rules are defined in [`firebase/firestore.rules`](firebase/firestore.rules). They enforce:

- Authenticated users can read and update their own `users/{uid}` document; deletion is disallowed by default.
- `feedback`, `analyses`, and `kb` documents can only be created, read, updated, or deleted by the owning user (`userId === request.auth.uid`).
- Knowledge base (`kb`) documents additionally allow public reads when `visibility == 'public'`.

Deploy the rules using the Firebase CLI once you have authenticated against your project:

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

To iterate locally, run the Firestore emulator, point your application to it via environment variables, and execute your integration or unit tests:

```bash
firebase emulators:start --only firestore
```

## Authentication flow

- The `AuthProvider` component wraps the entire App Router tree (see `app/layout.tsx`).
- `useFirebaseAuth` exposes the current `user`, loading state, and helper actions for email link and anonymous sign-in.
- The onboarding page at [`/sign-in`](app/%28auth%29/sign-in/page.tsx) guides users through email link authentication. It stores the pending email in `localStorage`, detects when the magic link is opened, and completes the flow automatically.
- If the user opts to continue as a guest, `signInAnonymously` provisions an anonymous Firebase Auth session and still creates a Firestore profile with default quotas.

With this structure, authenticated session state is available throughout the app via the `useAuth` hook, and Firestore reads can rely on the security rules to scope access to the active user.

## Deploying to production

1. Configure all environment variables in your deployment platform (Vercel, Cloud Run, etc.).
2. Confirm Firestore rules and indexes are deployed (`firebase deploy --only firestore:rules`).
3. Build the application: `npm run build`.
4. Start the production server: `npm run start` (or the equivalent command in your hosting environment).

For additional onboarding or automation workflows, refer to the documentation inside the `readme/` and `docs/` directories that shipped with this repository.
