# AI Life Coach

A Next.js web application that provides AI-powered life coaching across different domains:

- Career Guidance
- Physical & Fitness Guidance
- Financial/Investment Guidance
- Mental/Therapy Guidance

## Features

- Modern, responsive UI with animations
- Chat-based interface for interacting with AI coaches
- Domain-specific AI coaching with tailored advice
- Suggested prompts for easy conversation starters
- Powered by Hugging Face's language models

## Getting Started

### Prerequisites

- Node.js 18+ and npm installed on your machine
- A Hugging Face account and API token

### Setup Instructions

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd ai-life-coach
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up your environment variables

   - Copy `.env.local.example` to `.env.local` (or create a new `.env.local` file)
   - Get a Hugging Face API token from [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Add your token to the `.env.local` file:
     ```
     HUGGING_FACE_API_TOKEN=your_token_here
     ```

4. Start the development server

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to http://localhost:3000

## Hugging Face Integration

This project uses Hugging Face's Inference API to generate responses from AI models. By default, it uses the `mistralai/Mistral-7B-Instruct-v0.2` model, but you can change this in `app/api/llm/service.ts`.

Recommended models for chatbot applications:

- `meta-llama/Llama-2-7b-chat-hf`
- `microsoft/Phi-2`
- `google/gemma-7b-it`
- `mistralai/Mistral-7B-Instruct-v0.2`

## Project Structure

- `/app` - Next.js app directory with pages and API routes
- `/components` - Reusable React components
- `/public` - Static assets
- `/app/api` - Backend API routes
  - `/app/api/chat` - Chat API endpoint
  - `/app/api/llm` - LLM service for Hugging Face integration

## Building for Production

```bash
npm run build
npm run start
```

## License

[MIT](LICENSE)
