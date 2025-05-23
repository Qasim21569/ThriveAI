// Test OpenRouter API script
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';

console.log('Testing OpenRouter API connection');
console.log('API Key available:', !!apiKey);
console.log('API Key first 10 chars:', apiKey?.substring(0, 10));
console.log('Using model:', model);

async function testOpenRouter() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Life Coach Test'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: 'Say hello and confirm the API is working.' }
        ],
        max_tokens: 100,
        temperature: 0.7,
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from OpenRouter:', errorText);
      return;
    }

    const data = await response.json();
    console.log('API Response:', data.choices[0].message.content);
  } catch (error) {
    console.error('Error testing OpenRouter API:', error);
  }
}

testOpenRouter();
