export type NotionDatabaseProperty = {
  id: string;
  name: string;
  type: 'title' | 'rich_text' | 'select' | 'multi_select' | 'date' | 'people' | 'status';
};

export type NotionDatabasePreview = {
  id: string;
  title: string;
  properties: NotionDatabaseProperty[];
  lastSynced: string;
  isAuthenticated: boolean;
};

const MOCK_PROPERTIES: NotionDatabaseProperty[] = [
  {
    id: 'title',
    name: 'Name',
    type: 'title',
  },
  {
    id: 'feedback_status',
    name: 'Status',
    type: 'status',
  },
  {
    id: 'feedback_notes',
    name: 'Notes',
    type: 'rich_text',
  },
  {
    id: 'feedback_type',
    name: 'Category',
    type: 'select',
  },
];

function buildMockTitle(databaseId: string): string {
  const suffix = databaseId ? databaseId.slice(0, 6) : 'preview';
  return `Mock Notion Database (${suffix})`;
}

export async function fetchDatabasePreview(databaseId: string): Promise<NotionDatabasePreview> {
  if (!databaseId) {
    throw new Error('A Notion database ID is required.');
  }

  const isAuthenticated = Boolean(process.env.NOTION_API_KEY);
  const lastSynced = isAuthenticated ? '2023-01-01T00:00:00.000Z' : '1970-01-01T00:00:00.000Z';

  // TODO: Replace the mocked payload with a real Notion API query that pulls the database schema.
  return {
    id: databaseId,
    title: buildMockTitle(databaseId),
    properties: MOCK_PROPERTIES,
    lastSynced,
    isAuthenticated,
  };
}
