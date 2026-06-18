import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { pages } = await req.json();

  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    return NextResponse.json({ error: "pages array is required" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  // Concatenate pages and truncate to ~20k chars (~5k tokens) to stay under TPM limits
  const MAX_CHARS = 20000;
  const combinedContent = pages
    .map(
      (p: { url: string; title: string; markdown: string }, i: number) =>
        `--- PAGE ${i + 1}: ${p.title} ---\nURL: ${p.url}\n\n${p.markdown}`
    )
    .join("\n\n")
    .slice(0, MAX_CHARS);

  const systemPrompt = `You are a world-class data extraction expert. You will be given scraped markdown content from multiple pages of a website. Your job is to extract EVERY piece of information into a comprehensive, structured JSON object.

Extract absolutely everything — do NOT skip anything. If a section has no info, use null. Be thorough and detailed.

Return ONLY valid JSON with this exact structure:

{
  "business": {
    "name": "string",
    "tagline": "string | null",
    "description": "string — full detailed description",
    "founded": "string | null",
    "industry": "string",
    "mission": "string | null",
    "vision": "string | null"
  },
  "contact": {
    "email": "string | null",
    "phone": "string | null",
    "address": "string | null",
    "city": "string | null",
    "country": "string | null",
    "website": "string | null",
    "social": {
      "twitter": "string | null",
      "linkedin": "string | null",
      "facebook": "string | null",
      "instagram": "string | null",
      "youtube": "string | null",
      "other": ["string"]
    }
  },
  "hours": {
    "monday": "string | null",
    "tuesday": "string | null",
    "wednesday": "string | null",
    "thursday": "string | null",
    "friday": "string | null",
    "saturday": "string | null",
    "sunday": "string | null",
    "notes": "string | null"
  },
  "services": [
    {
      "name": "string",
      "description": "string",
      "price": "string | null",
      "duration": "string | null",
      "category": "string | null",
      "features": ["string"]
    }
  ],
  "products": [
    {
      "name": "string",
      "description": "string",
      "price": "string | null",
      "category": "string | null"
    }
  ],
  "team": [
    {
      "name": "string",
      "role": "string",
      "bio": "string | null",
      "email": "string | null"
    }
  ],
  "faqs": [
    {
      "question": "string",
      "answer": "string"
    }
  ],
  "testimonials": [
    {
      "author": "string",
      "role": "string | null",
      "text": "string",
      "rating": "number | null"
    }
  ],
  "pricing": [
    {
      "plan": "string",
      "price": "string",
      "billing": "string | null",
      "features": ["string"],
      "highlighted": "boolean"
    }
  ],
  "policies": {
    "privacy": "string | null",
    "terms": "string | null",
    "refund": "string | null",
    "shipping": "string | null",
    "other": ["string"]
  },
  "features": ["string"],
  "technologies": ["string"],
  "integrations": ["string"],
  "awards": ["string"],
  "certifications": ["string"],
  "partners": ["string"],
  "callToActions": ["string"],
  "locations": [
    {
      "name": "string",
      "address": "string",
      "phone": "string | null",
      "hours": "string | null"
    }
  ],
  "blog": [
    {
      "title": "string",
      "summary": "string | null",
      "date": "string | null",
      "url": "string | null"
    }
  ],
  "events": [
    {
      "name": "string",
      "date": "string | null",
      "description": "string | null"
    }
  ],
  "careers": [
    {
      "title": "string",
      "location": "string | null",
      "description": "string | null"
    }
  ],
  "rawSummary": "string — a comprehensive 3-5 paragraph summary of the entire website that a voice agent can use to answer ANY question about this business"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Here is all the scraped content from the website. Extract every single piece of information:\n\n${combinedContent}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const raw = response.choices[0].message.content ?? "{}";

  let structured: object;
  try {
    structured = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "OpenAI returned invalid JSON", raw }, { status: 500 });
  }

  return NextResponse.json({ structured, tokensUsed: response.usage?.total_tokens ?? 0 });
}
