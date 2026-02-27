# VC Intelligence Interface

A premium, functional VC discovery interface designed as a modern SaaS application. Features live AI data enrichment, curated startup lists, saved searches, custom theming, and dynamic profile views. Built for investors to streamline startup sourcing workflows.

![Screenshot](public/screenshot.png) *(Note: Replace with actual screenshot of the dashboard)*

## 🚀 Core Features & V2 Updates

- **SaaS UI Redesign**: Premium side-navigation and central view with unified custom `<Modal>` and global `<Toast>` notifications (no native browser pop-ups).
- **Light/Dark Mode**: Built-in `ThemeProvider` syncing smoothly with `localStorage` CSS variables for comfortable long-session viewing.
- **Dynamic Company Directory**: Add new startups manually via the UI. Custom URLs are merged with the mock database natively, allowing you to instantly profile, save, and enrich newly discovered companies.
- **Advanced Search & Filters**: Instantly find startups based on industry and funding stage.
- **Save Searches**: Persist your filter criteria using `localStorage` to quickly re-run queries later.
- **Lists Functionality**: Tag startups into unique custom collections, and export them directly to `.CSV` or `.JSON` effortlessly.
- **Live AI Enrichment Endpoint (`/api/enrich`)**: Secure, server-side dynamic API endpoint that fetches any public company webpage and passes standard HTML to the Gemini 2.5 Flash LLM. Returns structured, actionable startup insights (Summary, Keywords, What they do, and inferred signals) without exposing API keys to the client.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS Modules & global CSS Variables (No Tailwind CSS)
- **Icons**: Lucide React
- **Data Extractor**: Google Gemini 2.5 Flash via native `fetch` API server proxy
- **State Management**: Standard React context (`ThemeContext`, `ToastContext`) mapped to local/session Storage persistence APIs.

---

## 💻 Local Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Environment Variables

To utilize the Live Enrichment tool (the "Enrich" button in the company profile view), you need to provide a Google Gemini API key.

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Open `.env.local` and add your Gemini API Key. (You can generate one for free from Google AI Studio).
   ```text
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to preview the Intelligence UI.

---

## 🌍 Deployment

This application is SSR (Server-Side Rendring) compatible and production-ready for platforms like Vercel or Netlify. 

**Critical Step:** Ensure that the `GEMINI_API_KEY` is added to the Environment Variables settings of your deployment console for the production environment so the `/api/enrich` endpoint retains functionality. No extra configuration needed.
