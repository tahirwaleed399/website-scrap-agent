import { NextRequest, NextResponse } from "next/server";
import Retell from "retell-sdk";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  const { agentId } = await req.json();
  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RETELL_API_KEY not set" }, { status: 500 });

  const client = new Retell({ apiKey });
  await client.agent.delete(agentId);

  return NextResponse.json({ success: true });
}
