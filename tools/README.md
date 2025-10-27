# Gemini Local Test Harness

This directory provides tooling to exercise the Gemini webhook and parsing flow described in `whop_zapier_blueprint.json`.

## Contents

- `sample_whop_event.json` – Sample Whop payload containing the same placeholders referenced in the Zapier blueprint.
- `gemini_postman_collection.json` – Postman collection for sending the `generateContent` request to Gemini 1.5 Pro using an environment variable named `GOOGLE_GEMINI_API_KEY`.
- `scripts/gemini_test.js` – Node.js script that replays the webhook request and parses Gemini's response using the same logic as the Code by Zapier step.

## Quick start

1. Export a valid Gemini API key (AI Studio or Google Cloud) as `GOOGLE_GEMINI_API_KEY`.
2. Execute the local harness:

   ```bash
   GOOGLE_GEMINI_API_KEY=your-key-here node tools/scripts/gemini_test.js
   ```

   The script prints the `gemini_output` value returned by Gemini along with the evaluated word count.

## Using the Postman collection

1. Import `gemini_postman_collection.json` into Postman.
2. Create (or update) an environment with the variables listed below:
   - `GOOGLE_GEMINI_API_KEY`
   - `user_name`
   - `course_title`
   - `goal_text`
3. Send the "Generate Accountability Message" request. A successful call returns HTTP 200 and surfaces `candidates[0]` in the JSON response.
