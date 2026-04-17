import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_GENERATIONS_PER_DAY = 20;

export async function POST(req: NextRequest) {
  try {
    // 1. Verify User Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch (e) {
      console.error("Invalid token", e);
      return NextResponse.json({ error: "Unauthorized. Invalid Token." }, { status: 401 });
    }

    const uid = decodedToken.uid;

    // 2. Check Generation Limits
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const usageRef = adminDb().collection("users").doc(uid).collection("ai_usage").doc(today);

    // Use a transaction or just read/write since it's low concurrency
    const usageDoc = await usageRef.get();
    let currentGenerations = 0;

    if (usageDoc.exists) {
      const data = usageDoc.data();
      currentGenerations = data?.generations || 0;
      if (currentGenerations >= MAX_GENERATIONS_PER_DAY) {
        return NextResponse.json(
          { error: `Daily limit reached. You have used all ${MAX_GENERATIONS_PER_DAY} generations for today.` },
          { status: 429 }
        );
      }
    }

    // 3. Process Prompt
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "YOUR_GROQ_API_KEY_HERE") {
      return NextResponse.json(
        { error: "Groq API key is not configured in .env.local" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are Aetheris, an elite AI focus coach. Your job is to take a large goal from the user and break it down into actionable, 25-minute Pomodoro-sized sub-tasks.
Always respond ONLY in a valid JSON array format containing the string titles of the tasks. Do not include any other text, markdown formatting, or explanations.
Example output: ["Research Rome history", "Write outline", "Draft introduction", "Draft body paragraph 1"]`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Goal: ${prompt}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Groq API error:", errData);
      return NextResponse.json({ error: "Failed to generate tasks from AI." }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    const tokenUsage = data.usage?.total_tokens || 0;

    if (!content) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    let parsedTasks: string[];
    try {
      const cleanContent = content.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
      parsedTasks = JSON.parse(cleanContent);
      if (!Array.isArray(parsedTasks)) {
        throw new Error("Result is not an array");
      }
    } catch (e) {
      console.error("Failed to parse AI response as JSON array:", content);
      return NextResponse.json({ error: "AI response was not properly formatted" }, { status: 500 });
    }

    // 4. Update Database Usage
    await usageRef.set({
      generations: currentGenerations + 1,
      tokensUsed: (usageDoc.data()?.tokensUsed || 0) + tokenUsage,
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ tasks: parsedTasks, remainingGenerations: MAX_GENERATIONS_PER_DAY - (currentGenerations + 1) });
  } catch (error) {
    console.error("[Aetheris AI] Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth().verifyIdToken(token);
    
    const today = new Date().toISOString().split("T")[0];
    const usageRef = adminDb().collection("users").doc(decodedToken.uid).collection("ai_usage").doc(today);
    const usageDoc = await usageRef.get();
    
    if (!usageDoc.exists) {
      return NextResponse.json({ generations: 0, maxGenerations: MAX_GENERATIONS_PER_DAY, tokensUsed: 0 });
    }
    
    const data = usageDoc.data();
    return NextResponse.json({
      generations: data?.generations || 0,
      maxGenerations: MAX_GENERATIONS_PER_DAY,
      tokensUsed: data?.tokensUsed || 0
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
