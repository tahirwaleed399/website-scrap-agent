import { NextRequest } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

export const runtime = "nodejs";
export const maxDuration = 60;

function send(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return new Response(JSON.stringify({ error: "url is required" }), { status: 400 });
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not set" }), { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const app = new FirecrawlApp({ apiKey });

        send(controller, { step: "init", message: `Starting scrape for ${url}` });
        send(controller, { step: "scraping", message: `Scraping: ${url}`, pageIndex: 0, total: 1 });

        const result = await app.scrape(url, {
          formats: ["markdown"],
          proxy: "stealth",
          waitFor: 2000,
          onlyMainContent: false,
          blockAds: true,
          timeout: 30000,
        });

        if (!result.markdown || result.markdown.trim().length < 50) {
          send(controller, {
            step: "error",
            message: `Could not extract content from ${url}. The site may block scrapers.`,
          });
          controller.close();
          return;
        }

        const page = {
          url,
          title: result.metadata?.title ?? url,
          markdown: result.markdown,
        };

        send(controller, {
          step: "scraped",
          message: `✓ Scraped: ${page.title}`,
          pageIndex: 0,
          title: page.title,
        });

        send(controller, {
          step: "done",
          message: `Scraping complete — 1 page collected (${result.markdown.length.toLocaleString()} chars).`,
          pages: [page],
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        send(controller, { step: "error", message: `Scrape error: ${msg}` });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
