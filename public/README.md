# NEXA AI

A polished all-in-one AI workspace starter with:
- AI chat
- Image generation
- Video studio interface with configurable provider adapter
- Custom AI agent builder (saved in the current browser)
- Voice input and text-to-speech (browser support required)
- Coding assistant
- Text document analysis
- Research assistant
- Responsive desktop and mobile interface

## Requirements
- Node.js 18 or newer
- An OpenAI API key for chat, agent, coding, research, image and document AI
- A video API provider and compatible endpoint for real video rendering

## Run locally
1. Extract the ZIP.
2. Open a terminal in the project folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env`.
5. Add your API key to `.env`:
   ```env
   OPENAI_API_KEY=your_secret_key
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_IMAGE_MODEL=gpt-image-1
   ```
6. Start:
   ```bash
   npm start
   ```
7. Open `http://localhost:3000`.

Keep `.env` private. Never put API keys in `public/app.js`, HTML, or other browser code.

## Video integration
The `/api/video` route forwards a prompt to `VIDEO_API_URL` using a Bearer token from `VIDEO_API_KEY`. The example sends `{ "prompt": "..." }`. Adapt the request and response handling in `server.js` to match the chosen video provider's API, including asynchronous job polling and final video URL retrieval if required.

## Important limitations before production
This is a runnable starter, not a fully production-hardened public SaaS. Before public launch, add:
- User authentication and account recovery
- Database-backed user profiles, agent persistence and conversation history
- Per-user usage limits, rate limiting and abuse prevention
- Billing/subscriptions if you plan to charge users
- A real video-provider adapter with job status and result polling
- PDF parsing and secure file storage if PDF uploads are needed
- Logging, monitoring, backups, privacy policy and terms
- Deployment secrets and HTTPS on your hosting provider

## Security notes
- AI keys are read only by the Node server.
- Helmet security headers are enabled; CSP is disabled in this starter to allow the Google Fonts stylesheet. Configure a strict CSP before production.
- File uploads are memory-only and capped at 12 MB. Do not add persistent storage without access controls and retention rules.
- Do not expose this development server directly to the public internet without authentication, rate limits and operational security.
