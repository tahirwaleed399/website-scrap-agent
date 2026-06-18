import { NextRequest, NextResponse } from "next/server";
import Retell from "retell-sdk";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { agentId } = await req.json();

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RETELL_API_KEY not set" }, { status: 500 });
  }

  const client = new Retell({ apiKey });

  const webCallResponse = await client.call.createWebCall({ agent_id: agentId });

  return NextResponse.json({ accessToken: webCallResponse.access_token });
}
