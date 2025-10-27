#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_HOSTNAME = 'generativelanguage.googleapis.com';
const API_PATH = '/v1beta/models/gemini-1.5-pro:generateContent';
const SAMPLE_EVENT_PATH = path.resolve(__dirname, '..', 'sample_whop_event.json');

function loadSampleEvent() {
  const raw = fs.readFileSync(SAMPLE_EVENT_PATH, 'utf8');
  return JSON.parse(raw);
}

function buildRequestBody(sample) {
  const prompt = `Write a friendly, encouraging 3-sentence message for ${sample.user_name} who just finished ${sample.course_title} or set this goal: '${sample.goal_text}'. Include one short actionable tip. Keep it under 80 words. Avoid emojis.`;

  return {
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 200
    },
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };
}

function postJson(url, payload) {
  const data = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          const error = new Error(`Gemini API request failed with status ${res.statusCode}`);
          error.statusCode = res.statusCode;
          error.body = body;
          reject(error);
        }
      });
    });

    request.on('error', reject);
    request.write(data);
    request.end();
  });
}

function extractGeminiOutput(responseBody) {
  const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
  const candidateText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || parsed?.candidates?.[0]?.output_text || '';
  const trimmed = candidateText.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length > 80) {
    return words.slice(0, 80).join(' ');
  }

  return trimmed;
}

async function main() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Missing GOOGLE_GEMINI_API_KEY environment variable.');
    process.exitCode = 1;
    return;
  }

  const sample = loadSampleEvent();
  const payload = buildRequestBody(sample);

  const url = new URL(`https://${API_HOSTNAME}${API_PATH}`);
  url.searchParams.set('key', apiKey);

  try {
    const responseBody = await postJson(url, payload);
    const geminiOutput = extractGeminiOutput(responseBody);
    const wordCount = geminiOutput ? geminiOutput.trim().split(/\s+/).filter(Boolean).length : 0;

    console.log('gemini_output:', geminiOutput);
    console.log(`word_count: ${wordCount}`);
  } catch (error) {
    console.error('Failed to generate content from Gemini.');
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
    }
    if (error.body) {
      console.error('Response Body:', error.body);
    }
    console.error(error);
    process.exitCode = 1;
  }
}

main();
