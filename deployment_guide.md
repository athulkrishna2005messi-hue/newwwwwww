# Deployment Guide — Whop × Zapier × Gemini AI Accountability Partner

**Purpose**: This guide explains how to implement the automation blueprint connecting Whop, Zapier, and Gemini 1.5 Pro so that users receive short, personalized motivational messages when they complete lessons or submit goals.

---

## Prerequisites

- **Whop account** with access to Automations and Zapier integration.
- **Zapier account** (Starter plan or above recommended for multi-step Zaps, Looping, and Delay features).
- **Google AI Studio** account and **Gemini 1.5 Pro API key**.
- **Notion account** & integration (optional) if you want logging.
- Basic familiarity with Zapier: creating Zaps, mapping fields, using Webhooks by Zapier, Code by Zapier, Delay, and Looping.

**Secrets (do NOT commit to repo)**
- `GOOGLE_GEMINI_API_KEY`
- `WHOP_API_KEY`
- `NOTION_API_KEY` (optional)

---

## Architecture Overview

ASCII flow:

```

Whop (trigger: lesson completed or form submitted)
--> Zapier (Trigger)
--> Webhooks by Zapier (POST to Gemini 1.5 Pro)
--> Code by Zapier (parse gemini_output)
--> Whop (Send Chat Message)
--> (optional) Notion (Create Database Item)
--> (optional) Looping + Delay (follow-ups via Gemini -> Whop)

```

High-level: Whop emits an event, Zapier calls Gemini to generate a short motivational message, Zapier parses the response, then posts the message back into Whop chat. Optional logging and follow-ups can be enabled.

---

## Step-by-step Zap setup

### 1) Create a new Zap — Trigger: Whop
- App: **Whop**
- Event: **Lesson Completed** (or **Form Submitted** if you collect `goal_text` via a form)
- Test trigger: Pull a sample event and confirm you see fields such as `user_name`, `user_email`, `course_title`, `goal_text` (if present), `user_id`, `chat_channel_id`, `completed_at`.

### 2) Add Action — Webhooks by Zapier → Custom Request (POST)
- Method: `POST`
- URL:
```

[https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={{secrets.GOOGLE_GEMINI_API_KEY}}](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={{secrets.GOOGLE_GEMINI_API_KEY}})

````
- Headers:
```json
{ "Content-Type": "application/json" }
````

* Data (raw JSON):

```json
{
  "generationConfig": {
    "temperature": 0.7,
    "topP": 0.9,
    "topK": 40,
    "maxOutputTokens": 200
  },
  "contents": [
    {
      "parts": [
        {
          "text": "Write a friendly, encouraging 3-sentence message for {{steps.1.user_name}} who just finished {{steps.1.course_title}} or set this goal: '{{steps.1.goal_text}}'. Include one short actionable tip. Keep it under 80 words. Avoid emojis."
        }
      ]
    }
  ]
}
```

* Notes:

  * Use Zapier's raw body option and ensure it is sent as JSON.
  * If Zapier asks to unflatten, leave as-is (send JSON). Map the trigger fields into the prompt as shown.

### 3) Add Action — Code by Zapier → Run JavaScript

* Purpose: Parse Gemini's JSON response and extract the generated text.
* Input Data: `response` → map to the Webhooks step body/response (e.g., `{{steps.webhook_gemini.body}}`)
* Code (paste exactly):

```javascript
const parsed = typeof inputData.response === 'string' ? JSON.parse(inputData.response) : inputData.response;
const msg = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || parsed?.candidates?.[0]?.output_text || '';
return { gemini_output: msg.trim() };
```

* Test: Ensure the step returns `gemini_output` with a non-empty string.

### 4) Add Action — Whop → Send Chat Message

* App: **Whop**
* Event: **Send Chat Message**
* Fields to map:

  * `recipient_user_id` or `channel_id` → map to `{{trigger.user_id}}` or `{{trigger.chat_channel_id}}` depending on your Whop action fields.
  * `message` → Use the template:

```
Hey {{steps.1.user_name}}, your AI Accountability Partner says:
{{steps.3.gemini_output}}
Keep up the great work!
```

* Test: Confirm the message appears in the target Whop chat or inbox for the sample user.

### 5) (Optional) Add Action — Notion → Create Database Item (Logging)

* Create a Notion database called **Accountability Logs** with properties:

  * Title (Title)
  * User (Rich Text)
  * Goal (Rich Text)
  * Message (Rich Text)
  * Timestamp (Date)
* Map fields:

  * Title → `{{trigger.course_title}} – {{trigger.user_name}}`
  * User → `{{trigger.user_name}}`
  * Goal → `{{trigger.goal_text}}`
  * Message → `{{steps.code_parse_gemini.gemini_output}}`
  * Timestamp → `{{trigger.completed_at}}` (or `{{zap_meta_human_now}}`)

#### Notion setup reference

For a step-by-step walkthrough of creating the database schema, capturing the `NOTION_DATABASE_ID`, and testing mappings, see [docs/notion_setup.md](docs/notion_setup.md).

### 6) (Optional) Daily/Weekly follow-ups

Two options:

**Option A — Loop inside same Zap**

* Add **Looping by Zapier** (Create Loop From Numbers) with From: 1 To: N (e.g., 5 days).
* Inside loop: add a **Delay by Zapier** (Delay For 1 day) then reuse Webhooks → Gemini → Code → Whop steps to send follow-ups.

**Option B — Separate scheduled Zap**

* Trigger: **Schedule by Zapier** → Every Day/Week.
* Action: **Find records** (Notion or Whop) to locate users with active goals.
* For each record: call Gemini → parse → send message via Whop.

---

## Testing checklist

* [ ] Trigger a sample Whop event and confirm it reaches Zapier.
* [ ] Confirm Webhooks step returns HTTP 200 and response body includes `candidates[0]`.
* [ ] Confirm Code step returns `gemini_output` (non-empty, < 80 words).
* [ ] Confirm the Whop Send Chat Message posts correctly to the user or channel.
* [ ] If enabled, confirm Notion record is created with correct fields.
* [ ] If follow-ups enabled, confirm follow-up messages appear on schedule.

**Sample test data**

* `user_name`: Jane Doe
* `course_title`: Pricing Strategy 101
* `goal_text`: Ship MVP by Friday

---

## Security & privacy best practices

* **Do not commit secrets** into source control. Use Zapier's Connections & Secrets or environment-level secret management.
* **Scope keys minimally**: If possible, create keys with limited scopes and rotate periodically.
* **Filter logs**: Avoid logging PII in shared logs. Code by Zapier output can appear in Zapier task history — do not include API keys or sensitive user data in returned values.
* **Consent & opt-out**: Make clear to users that AI messages are automated and offer a simple way to opt out (e.g., reply "stop" or toggle in their settings). Implement opt-out handling as a separate Zap that disables follow-ups for that user.
* **Rate limits**: Be aware of Gemini API quotas. Batch or add delays to avoid rapid-fire calls for many users. Cache repeated messages where appropriate.

---

## Troubleshooting

* **403/401 from Gemini**: Verify `GOOGLE_GEMINI_API_KEY` is correct, project billing is enabled, and the key has permissions for the Generative Language API.
* **Empty `gemini_output`**: Confirm response path (`candidates[0].content.parts[0].text`) exists. Use the Code step to inspect `parsed` and log a safe subset for debugging.
* **Whop message not delivered**: Ensure correct mapping of `recipient_user_id` vs `channel_id`. Use the Whop API docs to confirm field names or keep using Zapier's native Whop action.
* **Zapier parsing errors**: If the Webhooks action returns a string, Code step JSON.parse will work; if it returns already-parsed JSON, parsing will be skipped (code handles both).
* **Rate limit / cost concerns**: If you expect high volume, consider summarizing multiple completions into a single Gemini call or upgrading API quota plans.

---

## Appendix — Example Gemini request (raw)

POST [https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_GEMINI_API_KEY](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_GEMINI_API_KEY)

Headers:

```
Content-Type: application/json
```

Body:

```json
{
  "generationConfig": {
    "temperature": 0.7,
    "topP": 0.9,
    "topK": 40,
    "maxOutputTokens": 200
  },
  "contents": [
    {
      "parts": [
        {
          "text": "Write a friendly, encouraging 3-sentence message for {{user_name}} who just finished {{course_title}} or set this goal: '{{goal_text}}'. Include one short actionable tip. Keep it under 80 words. Avoid emojis."
        }
      ]
    }
  ]
}
```

---

*End of deployment_guide.md*
