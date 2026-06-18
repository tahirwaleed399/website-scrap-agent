import { NextRequest, NextResponse } from "next/server";
import Retell from "retell-sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { structured, websiteUrl } = await req.json();

  if (!structured) {
    return NextResponse.json({ error: "structured data is required" }, { status: 400 });
  }

  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RETELL_API_KEY not set" }, { status: 500 });
  }

  const client = new Retell({ apiKey });

  const businessName = (structured as Record<string, Record<string, string>>).business?.name ?? "This Business";
  const rawSummary = (structured as Record<string, string>).rawSummary ?? "";

  // Build a comprehensive system prompt from all the structured data
  const systemPrompt = buildSystemPrompt(businessName, websiteUrl, rawSummary, structured);

  // Create or update the LLM
  const llm = await client.llm.create({
    model: "gpt-4.1",
    general_prompt: systemPrompt,
    begin_message: `Hi! I'm the AI assistant for ${businessName}. I've been trained on everything about this business — services, pricing, team, hours, and more. How can I help you today?`,
  });

  // Create the voice agent
  const agent = await client.agent.create({
    agent_name: `${businessName} Voice Agent`,
    voice_id: "11labs-Adrian",
    response_engine: { llm_id: llm.llm_id, type: "retell-llm" },
    language: "en-US",
    enable_backchannel: true,
    backchannel_frequency: 0.8,
    backchannel_words: ["got it", "sure", "absolutely", "of course"],
    reminder_trigger_ms: 10000,
    reminder_max_count: 2,
    ambient_sound: "coffee-shop",
    ambient_sound_volume: 0.1,
  });

  return NextResponse.json({
    agentId: agent.agent_id,
    llmId: llm.llm_id,
    agentName: agent.agent_name,
    voiceId: agent.voice_id,
  });
}

function buildSystemPrompt(
  businessName: string,
  websiteUrl: string,
  rawSummary: string,
  data: Record<string, unknown>
): string {
  const sections: string[] = [];

  sections.push(`You are the AI voice assistant for **${businessName}** (${websiteUrl}).
You have been trained on every piece of information available on their website.
You must answer every question confidently and completely. Never say you don't know — use the data below.
Be warm, professional, and helpful. Keep answers concise but complete.`);

  if (rawSummary) {
    sections.push(`## BUSINESS OVERVIEW\n${rawSummary}`);
  }

  const contact = data.contact as Record<string, string | Record<string, string>> | null;
  if (contact) {
    const contactLines = [];
    if (contact.email) contactLines.push(`Email: ${contact.email}`);
    if (contact.phone) contactLines.push(`Phone: ${contact.phone}`);
    if (contact.address) contactLines.push(`Address: ${contact.address}`);
    if (contact.city) contactLines.push(`City: ${contact.city}`);
    if (contact.country) contactLines.push(`Country: ${contact.country}`);
    if (contactLines.length > 0) {
      sections.push(`## CONTACT INFORMATION\n${contactLines.join("\n")}`);
    }
  }

  const hours = data.hours as Record<string, string> | null;
  if (hours) {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const hourLines = days
      .filter((d) => hours[d])
      .map((d) => `${d.charAt(0).toUpperCase() + d.slice(1)}: ${hours[d]}`);
    if (hourLines.length > 0) {
      sections.push(`## BUSINESS HOURS\n${hourLines.join("\n")}${hours.notes ? `\nNotes: ${hours.notes}` : ""}`);
    }
  }

  const services = data.services as Array<Record<string, unknown>> | null;
  if (services && services.length > 0) {
    const svcText = services
      .map((s) => {
        let line = `- **${s.name}**: ${s.description}`;
        if (s.price) line += ` | Price: ${s.price}`;
        if (s.duration) line += ` | Duration: ${s.duration}`;
        if (s.features && Array.isArray(s.features) && s.features.length > 0) {
          line += `\n  Features: ${(s.features as string[]).join(", ")}`;
        }
        return line;
      })
      .join("\n");
    sections.push(`## SERVICES\n${svcText}`);
  }

  const products = data.products as Array<Record<string, unknown>> | null;
  if (products && products.length > 0) {
    const prodText = products
      .map((p) => {
        let line = `- **${p.name}**: ${p.description}`;
        if (p.price) line += ` | Price: ${p.price}`;
        return line;
      })
      .join("\n");
    sections.push(`## PRODUCTS\n${prodText}`);
  }

  const pricing = data.pricing as Array<Record<string, unknown>> | null;
  if (pricing && pricing.length > 0) {
    const pricingText = pricing
      .map((p) => {
        let line = `- **${p.plan}**: ${p.price}`;
        if (p.billing) line += ` (${p.billing})`;
        if (p.features && Array.isArray(p.features)) {
          line += `\n  Includes: ${(p.features as string[]).join(", ")}`;
        }
        return line;
      })
      .join("\n");
    sections.push(`## PRICING PLANS\n${pricingText}`);
  }

  const team = data.team as Array<Record<string, string>> | null;
  if (team && team.length > 0) {
    const teamText = team
      .map((m) => `- **${m.name}** (${m.role})${m.bio ? `: ${m.bio}` : ""}`)
      .join("\n");
    sections.push(`## TEAM\n${teamText}`);
  }

  const faqs = data.faqs as Array<Record<string, string>> | null;
  if (faqs && faqs.length > 0) {
    const faqText = faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
    sections.push(`## FREQUENTLY ASKED QUESTIONS\n${faqText}`);
  }

  const testimonials = data.testimonials as Array<Record<string, string | number>> | null;
  if (testimonials && testimonials.length > 0) {
    const testText = testimonials
      .map((t) => `- "${t.text}" — ${t.author}${t.role ? `, ${t.role}` : ""}${t.rating ? ` (${t.rating}/5)` : ""}`)
      .join("\n");
    sections.push(`## CUSTOMER TESTIMONIALS\n${testText}`);
  }

  const features = data.features as string[] | null;
  if (features && features.length > 0) {
    sections.push(`## KEY FEATURES\n${features.map((f) => `- ${f}`).join("\n")}`);
  }

  const policies = data.policies as Record<string, string | string[]> | null;
  if (policies) {
    const polLines = [];
    if (policies.privacy) polLines.push(`Privacy Policy: ${policies.privacy}`);
    if (policies.terms) polLines.push(`Terms of Service: ${policies.terms}`);
    if (policies.refund) polLines.push(`Refund Policy: ${policies.refund}`);
    if (policies.shipping) polLines.push(`Shipping Policy: ${policies.shipping}`);
    if (polLines.length > 0) sections.push(`## POLICIES\n${polLines.join("\n")}`);
  }

  const locations = data.locations as Array<Record<string, string>> | null;
  if (locations && locations.length > 0) {
    const locText = locations
      .map((l) => `- **${l.name}**: ${l.address}${l.phone ? ` | Tel: ${l.phone}` : ""}${l.hours ? ` | Hours: ${l.hours}` : ""}`)
      .join("\n");
    sections.push(`## LOCATIONS\n${locText}`);
  }

  const integrations = data.integrations as string[] | null;
  if (integrations && integrations.length > 0) {
    sections.push(`## INTEGRATIONS & TECHNOLOGY\n${integrations.map((i) => `- ${i}`).join("\n")}`);
  }

  sections.push(`## INSTRUCTIONS
- Always be helpful and answer every question based on the data above.
- If asked about something not in the data, say "I don't have that specific detail handy, but I'd recommend reaching out to the team directly."
- Keep responses natural and conversational — you are speaking, not writing.
- Never read out URLs unless specifically asked.
- For pricing questions, give exact numbers if available.
- Always offer to help with anything else at the end of each response.`);

  return sections.join("\n\n");
}
