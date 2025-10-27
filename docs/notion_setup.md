# Notion Setup for Optional Logging

Use this guide to create the Notion database that stores optional accountability logs, capture the database identifier, and connect it to the Zapier blueprint in this project.

## 1. Create (or reuse) a Notion integration

1. Visit [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations) and create an internal integration if you do not already have one.
2. Save the **Internal Integration Token** securely. This becomes your `NOTION_API_KEY` secret in Zapier.
3. In Notion, choose or create a page that will host the accountability database, then share the page with the integration so it has access.

## 2. Create the database with the provided schema

You can create the database via the Notion UI or by calling the Notion API.

### Option A — Create via the Notion app

1. On the page you shared with the integration, add a new **Database** → **Table (Full page)**.
2. Rename the database to **Accountability Logs** (or your preferred name).
3. Configure the properties so they match the schema used in the Zap blueprint:
   - **Title** (Property type: *Title*)
   - **User** (Property type: *Rich text*)
   - **Goal** (Property type: *Rich text*)
   - **Message** (Property type: *Rich text*)
   - **Timestamp** (Property type: *Date*)

### Option B — Create via the Notion API console

1. Open the [Create database endpoint](https://developers.notion.com/reference/post-database) in the Notion API console.
2. Use the contents of [`examples/notion_schema.json`](../examples/notion_schema.json) as the request body.
   - Replace `YOUR_NOTION_PAGE_ID` with the parent page ID where the database should live.
   - Optional: Update the `title` text if you want to rename the database.
3. Execute the request with your integration token. The API response returns the new database `id`.

## 3. Capture your `NOTION_DATABASE_ID`

Whichever creation method you use, locate the database ID and store it for later:

- **From the API response**: copy the `id` field (a 32-character UUID without dashes if you remove them).
- **From the Notion URL**: open the database in your browser and copy the 32-character ID found between the last `/` and the `?` in the URL.
- Add this value as a Zapier secret or environment variable named `NOTION_DATABASE_ID`.

## 4. Map fields in Zapier

When you enable the optional "Create Database Item" action in the Zap blueprint, map the fields as follows:

| Notion Property | Zapier Value |
|-----------------|--------------|
| **Title**       | `{{trigger.course_title}} – {{trigger.user_name}}` |
| **User**        | `{{trigger.user_name}}` |
| **Goal**        | `{{trigger.goal_text}}` |
| **Message**     | `{{steps.code_parse_gemini.gemini_output}}` |
| **Timestamp**   | `{{zap_meta_human_now}}` or `{{trigger.completed_at}}` |

If you add additional properties in Notion, keep the original five so the provided Zapier blueprint continues to work.

## 5. Test your configuration

1. Use the Notion API console with [`examples/notion_item_example.json`](../examples/notion_item_example.json) as a sample payload.
   - Replace `YOUR_NOTION_DATABASE_ID` with the value you captured.
   - Confirm the payload creates a row with the correct property values.
2. In Zapier, turn on the Notion action and run a test task to verify the item appears in your database.

Once the database is confirmed, the optional logging step in the Zap can be enabled safely.
