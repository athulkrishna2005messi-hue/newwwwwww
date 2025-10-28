# Integration stubs

This branch introduces scaffolding for upcoming ingestion integrations (Notion and Google Forms) along with a feature flag system that gates access on a per-user basis.

## Feature flags

- `src/lib/featureFlags.ts` encapsulates feature flag access. The module attempts to resolve data from Firestore documents at `users/{uid}` by reading the `featureFlags` and `requestedIntegrations` fields. When Firestore is unavailable (such as during local development without credentials) it falls back to an in-memory store so that the rest of the application continues to operate.
- Helper functions expose the current state (`getUserFeatureFlagState`), perform flag checks (`isFeatureFlagEnabled`), and allow users to request access (`requestIntegrationAccess`). Requests are persisted back to Firestore when a connection is available.

## Integration utilities

- `src/lib/integrations/notion.ts` provides a `fetchDatabasePreview` helper that validates the `NOTION_API_KEY` environment variable and returns a deterministic mocked schema for a given database ID. This is the integration point for replacing the stub with a real Notion API call in the future.
- `src/lib/integrations/googleForms.ts` contains `buildGoogleFormsPreview`, which accepts CSV content exported from Google Forms and produces a normalized preview of questions and responses. The function operates without talking to Google APIs but can be enhanced to authenticate with a service account when the real integration is ready.

## API routes

- `app/api/integrations/notion/route.ts` validates incoming requests, checks the Notion flag, and returns the mocked preview payload.
- `app/api/integrations/google-forms/route.ts` mirrors the same workflow for Google Forms CSV previews.

Both routes respond with predictable JSON payloads so the frontend can be wired up without waiting for the production integrations.

## Ingestion UI placeholders

- `app/(app)/ingest/components/IntegrationCards.tsx` renders cards for each upcoming integration. Users can request access, which writes to the feature flag store (and Firestore when configured). The cards surface the underlying feature flag keys and link to external documentation for context. Until the flag is enabled, the UI is clearly marked as “Coming soon”.

## Environment variables

The following environment variables are optional but reserved for future integration work:

```bash
NOTION_API_KEY=""
GOOGLE_SERVICE_ACCOUNT_JSON=""
```

Populate these values in `.env.local` once the production connectors are implemented. For now they can remain empty so the stubs operate in demo mode.

## Next steps for full integrations

1. Replace the mocked Notion preview with a real client that authenticates with the Notion API using the configured API key.
2. Wire the Google Forms helper to Google Drive / Forms APIs using the service account JSON credentials, handling CSV retrieval directly from the source.
3. Migrate the in-memory feature flag fallback to a robust Firestore implementation, including analytics/webhooks for access requests.
4. Extend the ingestion UI to surface real status indicators (sync history, error states) once backend connectors are live.
