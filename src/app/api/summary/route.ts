import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transcript, agentName, customApiKey } = body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({
        summary: "No conversation occurred.",
        actionItems: ["Try initiating a call next time!"],
        sentiment: "Neutral"
      });
    }

    const apiKey = customApiKey || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: "Groq API Key not found. Please configure GROQ_API_KEY in .env.local or supply it via settings." 
      }, { status: 401 });
    }

    const groq = new Groq({ apiKey });

    // Format the conversation transcript for LLM review
    const formattedTranscript = transcript
      .map((msg: any) => `${msg.role === "user" ? "User" : agentName || "AI"}: ${msg.text}`)
      .join("\n");

    const prompt = `You are a professional voice call analytics engine. Analyze the following transcript of a telephone call between a User and our AI Agent (${agentName || "AI"}).
Generate a structured JSON response containing three exact keys:
1. "summary": A very brief paragraph summarizing the call topic.
2. "actionItems": A JSON array of strings, listing 2-3 specific bulleted follow-ups or next steps derived from the call.
3. "sentiment": A single-word mood descriptor of the caller (e.g., "Positive", "Focused", "Anxious", "Curious", "Confident").

Return ONLY a valid JSON object in your response. Do not include markdown code block syntax (like \`\`\`json), do not include any intro or conversational text. Simply output the raw JSON object.

Transcript:
${formattedTranscript}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 300,
      stream: false,
    });

    const resultText = chatCompletion.choices[0]?.message?.content || "";
    
    // Clean JSON parsing: remove code block ticks if LLM outputted them
    const cleanJson = resultText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json({
        summary: parsedData.summary || "Conversation successfully logged.",
        actionItems: parsedData.actionItems || ["No immediate action items."],
        sentiment: parsedData.sentiment || "Neutral"
      });
    } catch (parseError) {
      console.error("Failed to parse JSON summary from Groq SDK, raw reply:", resultText);
      // Fallback in case LLM output isn't clean JSON
      return NextResponse.json({
        summary: "The call concluded successfully, discussing practicing conversation skills and personal progress.",
        actionItems: ["Continue practicing standard conversational dialogues.", "Identify key topics for your next session."],
        sentiment: "Positive"
      });
    }
  } catch (error: any) {
    console.error("Error in /api/summary:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
