import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { level, message, details } = await req.json();
    console.log(
      `[CLIENT-LOG] [${level || "INFO"}] ${message}`,
      details ? `\nDetails: ${JSON.stringify(details, null, 2)}` : ""
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logger API route failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
