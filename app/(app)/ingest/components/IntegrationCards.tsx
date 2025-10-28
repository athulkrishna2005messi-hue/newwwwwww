import { revalidatePath } from 'next/cache';

import {
  FEATURE_FLAG_DEFINITIONS,
  FeatureFlagKey,
  FeatureFlagState,
  getUserFeatureFlagState,
  requestIntegrationAccess,
} from '../../../../src/lib/featureFlags';

const INTEGRATIONS: Array<{
  key: FeatureFlagKey;
  title: string;
  description: string;
  docsUrl?: string;
}> = [
  {
    key: 'notionImport',
    title: 'Notion',
    description: 'Import structured product feedback from a Notion database into the ingestion pipeline.',
    docsUrl: 'https://www.notion.so/',
  },
  {
    key: 'googleFormsImport',
    title: 'Google Forms',
    description: 'Transform Google Forms CSV exports into actionable feedback items.',
    docsUrl: 'https://www.google.com/forms/about/',
  },
];

function parseFeatureFlagKey(value: FormDataEntryValue | null): FeatureFlagKey | null {
  if (typeof value !== 'string') {
    return null;
  }

  return value in FEATURE_FLAG_DEFINITIONS ? (value as FeatureFlagKey) : null;
}

function renderStatus(state: FeatureFlagState, key: FeatureFlagKey): string {
  if (state.flags[key]) {
    return 'Enabled';
  }

  if (state.requested.includes(key)) {
    return 'Requested';
  }

  return 'Coming soon';
}

type IntegrationCardsProps = {
  userId: string;
  revalidatePathname?: string;
};

export default async function IntegrationCards({
  userId,
  revalidatePathname = '/app/ingest',
}: IntegrationCardsProps) {
  const featureState = await getUserFeatureFlagState(userId);

  const requestAccess = async (formData: FormData) => {
    'use server';

    const flag = parseFeatureFlagKey(formData.get('flag'));
    if (!flag) {
      return;
    }

    await requestIntegrationAccess(userId, flag);

    if (revalidatePathname) {
      revalidatePath(revalidatePathname);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">External integrations</h2>
        <p className="text-sm text-neutral-600">
          Preview upcoming ingestion sources and request early access to unlock them for your workspace.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const status = renderStatus(featureState, integration.key);
          const isEnabled = status === 'Enabled';
          const isRequested = status === 'Requested';

          return (
            <article
              key={integration.key}
              className="flex h-full flex-col justify-between rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold">{integration.title}</h3>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">{status}</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600">{integration.description}</p>
                <p className="text-xs text-neutral-500">
                  Feature flag: {FEATURE_FLAG_DEFINITIONS[integration.key].label}
                </p>
                {integration.docsUrl ? (
                  <a
                    href={integration.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Explore documentation
                  </a>
                ) : null}
              </div>

              <form action={requestAccess} className="mt-6">
                <input type="hidden" name="flag" value={integration.key} />
                <button
                  type="submit"
                  disabled={isEnabled || isRequested}
                  className="inline-flex w-full items-center justify-center rounded-md border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-transparent"
                >
                  {isEnabled ? 'Enabled' : isRequested ? 'Access requested' : 'Request access'}
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
