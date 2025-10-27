# Whop × Zapier × Gemini AI Accountability Partner Onboarding Guide

This guide describes how to implement the intake and onboarding automation for new buyers of the Whop × Zapier × Gemini AI Accountability Partner program. The flow automates collection of buyer intents, generates a tailored AI coach brief, updates the internal Notion workspace, and marks the buyer as onboarded in Whop.

---

## 1. Overview & Architecture

```
Buyer (Google Form)
        │
        ▼
Google Sheets (Form Responses)
        │  Trigger: New Spreadsheet Row
        ▼
Zapier: "Buyer Intake → AI Coach Setup + Onboarding"
        ├─ Formatter (normalize inputs)
        ├─ Webhook → Gemini 1.5 Pro (generate coach plan)
        ├─ Code by Zapier (parse response)
        ├─ Notion (internal Buyers DB record)
        ├─ [Optional] Notion page in buyer workspace
        ├─ [Optional] Slack/Email notification
        ├─ Whop metadata update (mark onboarded)
        └─ [Optional] Frequency-specific follow-up paths
```

The source blueprint for this flow lives at `/automations/intake_form_flow.json`.

---

## 2. Build the Intake Form (Google Forms)

1. Create a new Google Form titled **"AI Accountability Partner Intake"**.
2. Add the required fields in the exact order below to simplify mapping:
   - **Buyer’s full name** — Short answer (required)
   - **Whop purchase email** — Short answer, set response validation to "Text → Email" (required)
   - **Notion workspace link** — Short answer, response validation "Text → URL" (required)
   - **Primary goal/focus** — Dropdown with options *Fitness, Learning, Productivity, Career, Custom* (required)
   - **Preferred update frequency** — Dropdown with options *daily, weekly, custom* (required)
   - **Optional notes** — Paragraph (optional)
3. In *Settings → Responses*, enable **Collect email addresses** only if your buyers will be authenticated. Otherwise, leave it off to avoid mismatched addresses.
4. Connect the form to a new Google Sheet via **Responses → Link to Sheets**. The sheet becomes the trigger source in Zapier.

> **Tip:** Keep the sheet name stable (e.g., `Intake Responses`). Any changes require you to refresh the trigger sample in Zapier.

---

## 3. Configure the Zap Trigger

1. In Zapier, create a new Zap named **"Buyer Intake → AI Coach Setup + Onboarding"**.
2. **Trigger step:**
   - **App:** Google Sheets
   - **Event:** *New Spreadsheet Row*
   - **Account:** Connect the Google account that owns the intake sheet.
   - **Spreadsheet:** Select the sheet linked to the form.
   - **Worksheet:** Choose the tab where responses land (usually `Form Responses 1`).
3. Pull in sample data to expose column fields. The Zap should reveal fields for name, email, Notion workspace link, primary goal, preferred update frequency, and optional notes.
4. Rename the step to `Trigger - Intake Response` for clarity.

---

## 4. Formatter by Zapier – Normalize Inputs

Add a **Formatter by Zapier → Utilities** step named `Normalize Inputs`.

Recommended transforms:
- **Transform:** *Text → Lowercase* for the Whop purchase email.
- **Transform:** *Text → Replace* or *Utilities → Lookup Table* to coerce frequencies to the allowed values `daily`, `weekly`, or `custom`.
- **Transform:** *Text → Trim Whitespace* for name and notes.

Return a bundle with keys matching the downstream references:
- `name`
- `email`
- `notion_workspace_link`
- `goal_category`
- `frequency`
- `notes`

These keys are referenced later as `{{steps.1.field}}` in the blueprint (`steps.1` corresponds to this formatter step when it is the first after the trigger).

---

## 5. Webhook → Gemini 1.5 Pro

Add a **Webhooks by Zapier → Custom Request** step titled `Gemini Coach Brief`.

- **Method:** POST
- **URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`
- **Query String Params:** `key = {{secrets.GOOGLE_GEMINI_API_KEY}}`
- **Headers:**
  - `Content-Type: application/json`
- **Data (raw JSON):**

```json
{
  "generationConfig": {
    "temperature": 0.7,
    "topP": 0.9,
    "topK": 40,
    "maxOutputTokens": 400
  },
  "contents": [
    {
      "parts": [
        {
          "text": "Create a concise AI coach setup brief for a new buyer. Fields: Name={{steps.1.name}}, Email={{steps.1.email}}, Goal Category={{steps.1.goal_category}}, Preferred Frequency={{steps.1.frequency}}, Notes='{{steps.1.notes}}'. Output 3 sections: (1) Welcome message (≤80 words) (2) Coaching focus checklist (3) 7-day cadence suggestion aligned to frequency. Avoid emojis."
        }
      ]
    }
  ]
}
```

Zapier automatically stores the raw body at `{{steps.webhook_gemini_coach.raw_body}}` and the parsed body at `{{steps.webhook_gemini_coach.body}}`.

> **Note:** Ensure the Google Gemini connection in Zapier uses a secret named `GOOGLE_GEMINI_API_KEY`. Store it through Zapier's "Store Secret" capability or environment variables.

---

## 6. Code by Zapier – Parse Gemini Response

Add a **Code by Zapier → Run JavaScript** step named `Parse Gemini Coach Plan`.

- **Input Data:**
  - Key: `response`
  - Value: `{{steps.webhook_gemini_coach.body}}`
- **Code:**

```javascript
const parsed = typeof inputData.response === 'string'
  ? JSON.parse(inputData.response)
  : inputData.response;

const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
  || parsed?.candidates?.[0]?.output_text
  || '';

return { coach_plan: text.trim() };
```

The step returns `coach_plan` ready for Notion and downstream usage.

> **Troubleshooting:** If Gemini returns a malformed payload, wrap the `JSON.parse` call in a try/catch and log `console.log` output for debugging. See the troubleshooting section below.

---

## 7. Notion – Internal Buyers Database Setup

### 7.1 Prepare the Database

Create (or reuse) a Notion database to track buyers. Recommended schema:

| Property Name      | Type        | Purpose                                        |
|--------------------|-------------|------------------------------------------------|
| **Title**          | Title       | Buyer display name (`Name (Email)`)            |
| **Workspace Link** | URL         | Buyer-provided Notion workspace/home link      |
| **Goal Category**  | Select      | Options: Fitness, Learning, Productivity, Career, Custom |
| **Frequency**      | Select      | Options: daily, weekly, custom                 |
| **Notes**          | Rich text   | Optional notes from intake                     |
| **Coach Plan**     | Rich text   | Generated plan from Gemini                     |
| **Status**         | Select      | e.g., In Progress → Complete pipeline stages   |

Share the database with your Notion integration to grant API access. Capture the database ID and store it in Zapier as `NOTION_BUYERS_DB_ID`.

### 7.2 Create the Record

Add a **Notion → Create Database Item** step named `Notion - Create Buyer Record` with fields:

- **Database:** Use `{{secrets.NOTION_BUYERS_DB_ID}}` (custom value).
- **Properties:**
  - **Title:** `{{steps.1.name}} ({{steps.1.email}})`
  - **Workspace Link:** `{{steps.1.notion_workspace_link}}`
  - **Goal Category:** Select `{{steps.1.goal_category}}`
  - **Frequency:** Select `{{steps.1.frequency}}`
  - **Notes:** `{{steps.1.notes}}`
  - **Coach Plan:** `{{steps.code_parse_gemini_coach.coach_plan}}`
  - **Status:** Set to `In Progress`

The created page URL is useful in later notification steps.

### 7.3 Optional – Push to Buyer Workspace

If the buyer grants access to a shared page or database:

1. Add a **Notion → Create Page** step.
2. Set **Parent:** `{{secrets.NOTION_BUYER_SHARED_PARENT_ID}}` (the shared page/database ID).
3. **Title:** `{{steps.1.name}} – AI Coach Plan`
4. **Content:** Insert the `coach_plan` text via your preferred block payload (e.g., using a paragraph block).

> **Permissions:** The buyer must explicitly invite your integration to their page/database. Without access, this step will fail with a `403` error.

---

## 8. Optional Notifications

### Slack

- **App:** Slack
- **Event:** Send Channel Message
- **Channel:** e.g., `#onboarding`
- **Message:**
  ```
  New buyer onboarded: {{steps.1.name}} ({{steps.1.email}})
  Goal: {{steps.1.goal_category}} | Frequency: {{steps.1.frequency}}
  Notion record: {{steps.notion_create_internal_record.url}}
  ```
- Store your Slack OAuth token securely; consider using a dedicated bot user with limited scopes (chat:write, channels:read).

### Email Alternative

Use **Email by Zapier** or a transactional provider (Mailgun, SendGrid) to send the summary if Slack is unavailable.

---

## 9. Whop Metadata Update

### 9.1 Lookup Buyer

If Zapier offers a native Whop action, use **Whop → Find User** with the buyer’s email. Otherwise, use **Webhooks by Zapier → GET**:

- **URL:** `https://api.whop.com/v2/users`
- **Query Params:** `email = {{steps.1.email}}`
- **Headers:** `Authorization: Bearer {{secrets.WHOP_API_KEY}}`

Store the response (typically `data[0]`) for the update step.

### 9.2 Patch Metadata

Follow with **Webhooks by Zapier → Custom Request**:

- **Method:** PATCH
- **URL:** `https://api.whop.com/v2/users/{{steps.lookup_whop_user.data[0].id}}/metadata`
- **Headers:**
  - `Authorization: Bearer {{secrets.WHOP_API_KEY}}`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "onboarded": true,
    "goal_category": "{{steps.1.goal_category}}",
    "frequency": "{{steps.1.frequency}}"
  }
  ```

> **Testing:** Use a sandbox buyer profile or a test environment if available. Confirm the metadata change in Whop’s dashboard or via a subsequent GET call.

---

## 10. Frequency-Specific Follow-Up (Optional)

Add a **Paths** group after the metadata update:

- **Path A – Daily:** Filter for `frequency = daily`, delay one day, then send a Whop chat message or follow-up automation.
- **Path B – Weekly:** Mirror the daily path with a 7-day delay.
- **Path C – Custom:** Route to a manual review queue (e.g., send Slack DM).

These steps are disabled by default in the shared blueprint. Enable and tailor them once you have a follow-up playbook.

---

## 11. Alternative Trigger: Notion Intake Database

If you prefer a native Notion form or database intake:

1. Create a Notion database titled **"Intake Responses"** with the same properties as the Google Form.
2. Share it with your Notion integration.
3. Replace the Zap trigger with **Notion → New Database Item**.
4. Map each property to the formatter step inputs (name, email, etc.).
5. The downstream steps remain unchanged because the formatter normalizes the keys.

> **Restriction:** Notion’s API currently has rate limits (~3 requests per second). Batch processing or short-term delays may be required if you expect a high volume of submissions.

---

## 12. Security & Privacy Best Practices

- **Secrets:** Store `GOOGLE_GEMINI_API_KEY`, `NOTION_API_KEY`, `WHOP_API_KEY`, `NOTION_BUYERS_DB_ID`, and optional IDs using Zapier’s "Store Secret" feature or app connections. Never hard-code them in Code by Zapier or Webhook steps.
- **Least Privilege:** Limit Notion and Slack scopes to only what is required. Revoke access for integrations that are no longer in use.
- **PII Handling:** Avoid logging personally identifiable information in Zapier task history or Code steps. If debugging, use temporary console logs and remove them once resolved.
- **Rate Limiting:**
  - Gemini: Respect the quotas associated with your Google Cloud project.
  - Notion: Stay under 3 requests/second; insert delays for batched updates.
  - Whop API: Monitor for `429` rate-limit responses and retry with exponential backoff.
- **Data Retention:** Periodically review stored intake data to comply with privacy policies and user data requests.

---

## 13. Testing Checklist

1. **Submit Test Form:** Use a sample name/email and confirm the Google Sheet captures the row.
2. **Trigger Run:** Use Zapier’s test trigger to ensure fields map correctly.
3. **Gemini Response:** Test the Webhooks step; verify a coach plan is returned with three sections.
4. **Parser Output:** Confirm the Code step outputs the `coach_plan` field with clean formatting (no leading/trailing whitespace).
5. **Notion Record:** Ensure the Buyers database receives a new entry with all properties populated.
6. **Optional Notion Page:** If enabled, verify the buyer-facing page is created within their shared workspace.
7. **Notifications:** Confirm Slack or email messages deliver accurately formatted summaries.
8. **Whop Metadata:** Validate the user’s metadata updates correctly; inspect the user record to ensure `onboarded` is `true`.
9. **Error Handling:** Trigger deliberate errors (e.g., revoke Notion access) to confirm Zapier surfaces actionable messages.

---

## 14. Troubleshooting Guide

| Issue | Symptom | Resolution |
|-------|---------|------------|
| **Gemini HTTP 4xx/5xx** | Webhook step fails with error from Google | Verify API key permissions, check quota usage, and ensure the request body is valid JSON. Retry with reduced `maxOutputTokens` if responses are too large. |
| **JSON Parse Failure** | Code step logs `Unexpected token` errors | Wrap `JSON.parse` in try/catch, add `console.log(inputData.response)` for debugging, and confirm the webhook step is returning JSON, not plain text. |
| **Notion 403** | Notion step errors with `insufficient permissions` | Confirm the database/page is shared with the integration and that the Notion integration has the necessary capabilities enabled. |
| **Notion Property Mismatch** | Properties fail to map or create | Double-check property names, especially select option spelling/casing, and re-fetch the schema in Zapier after any Notion schema changes. |
| **Whop API 404/422** | Metadata update fails | Ensure the lookup step found the user (`data` array not empty). Validate that the metadata fields exist or that the endpoint supports arbitrary metadata keys. |
| **Zapier Task Quotas** | Zap stops due to plan limits | Consider enabling "Auto Replay" or upgrading the Zapier plan. Batch non-critical notifications to reduce run counts. |
| **Form Submission Delays** | Zap trigger runs late | Verify Google Sheet availability, ensure Zapier is turned on, and check Zapier platform status for Google Sheets latency. |

---

## 15. Next Steps & Enhancements

- Enable the optional follow-up paths once repeatable cadences are defined.
- Layer in analytics by logging each onboarding to a BI dataset (e.g., BigQuery, Airtable).
- Add a manual override path in Notion for high-touch onboarding scenarios.
- Integrate a feedback loop by capturing buyer satisfaction after the first week and updating the database.

With the above configuration, every buyer submission flows seamlessly from intake to coach setup, ensuring consistent onboarding and centralized records. Refer to `/automations/intake_form_flow.json` for the machine-readable blueprint.
