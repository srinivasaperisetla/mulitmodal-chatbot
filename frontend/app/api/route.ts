import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const API_KEY = process.env.GOOGLE_API_KEY; // Securely access API key from backend

    if (!API_KEY) {
      return NextResponse.json({ error: "API key not found" }, { status: 500 });
    }

    const { inputMessage } = await req.json();
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(inputMessage);
    const aiResponse = result.response.text();

    return NextResponse.json({ text: aiResponse });
  }
  catch (error){
    console.error("Error in AI processing:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
  

}
