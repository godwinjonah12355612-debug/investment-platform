
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const update = await request.json();

    const message = update?.message;

    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const text = String(message.text).trim();

    if (!text || text === "/start") {
      return NextResponse.json({ ok: true });
    }

    console.log("TELEGRAM SUPPORT REPLY:", {
      chatId: message.chat?.id,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    return NextResponse.json(
      { error: "Webhook error." },
      { status: 500 }
    );
  }
}
