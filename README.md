# Signalist

A stock-tracking dashboard with a built-in AI assistant that researches any stock **live** the moment you ask about it, then answers your questions grounded in that real data.

## AI chat

Click any ticker in the "Explore Stocks" grid and a chat widget opens — not with canned info, but by triggering a real-time research pipeline on the [StockSage](https://github.com/akachi11/StockSage) backend: live price and company data gets pulled from Finnhub, synthesized into structured facts by Gemini, embedded, and stored, all while you watch the progress in the chat.

Once that's done, ask it anything. If the gathered data actually covers your question, the answer is grounded in it and labeled **Verified data**. If it doesn't, the assistant says so plainly and still answers from general knowledge — labeled **General knowledge** — rather than refusing outright or pretending to know something it doesn't.

Market context (price charts, the sector heatmap, top stories) comes from embedded TradingView widgets elsewhere on the dashboard.

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4, shadcn/ui (`base-nova` style)
- **AI backend:** [StockSage](https://github.com/akachi11/StockSage) — a separate Node/Express + Supabase(pgvector) + Gemini + Finnhub service that does the actual research and retrieval-augmented answering

## Getting started

This app expects the [StockSage](https://github.com/akachi11/StockSage) backend running alongside it — the chat widget has nothing to talk to without it.

```bash
npm install
cp .env.example .env.local   # point at your running StockSage backend
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_STOCKSAGE_API_URL` | Base URL of the StockSage backend, e.g. `http://localhost:3000` |

## Project structure

```
app/
  (root)/        dashboard, wrapped in ChatProvider
  (auth)/        sign-in / sign-up
components/
  PopularStocks.tsx   clickable ticker grid — the entry point into the AI chat
  ChatProvider.tsx    shares "which ticker / is chat open" state across components
  AIChatWidget.tsx     the floating chat: live seeding progress, grounded answers
  TradingViewWidget.tsx  generic wrapper around TradingView's embedded widgets
lib/
  constants.ts     widget configs, ticker list, chat message types
```

## License

MIT
