import { NextResponse } from "next/server";
import Retell from "retell-sdk";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RETELL_API_KEY not set" }, { status: 500 });
  }

  const client = new Retell({ apiKey });
  const agents = await client.agent.list();

  // Only show agents created by this app (name contains " Voice Agent" suffix we set)
  const appAgents = agents
    .filter((a) => a.agent_name?.includes(" Voice Agent"))
    .map((a) => ({
      agentId: a.agent_id,
      agentName: a.agent_name,
      voiceId: a.voice_id,
      createdAt: a.last_modification_timestamp ?? null,
    }))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return NextResponse.json({ agents: appAgents });
}
