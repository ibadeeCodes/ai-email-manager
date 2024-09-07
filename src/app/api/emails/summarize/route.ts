import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const accessToken = req.headers.get('authorization')?.split(' ')[1];

        const { emailId } = await req.json();

        if (!emailId || !accessToken) {
            return NextResponse.json({ error: 'Missing email ID or access token' }, { status: 400 });
        }

        // Step 1: Get the email body by ID through Gmail API
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const emailResponse = await gmail.users.messages.get({
          userId: 'me',
          id: emailId,
          format: 'full',
        });
        
        // Check if the payload contains any body parts
        let emailBody = '';
        
        // Helper function to decode base64
        const decodeBody = (bodyData: string) => {
          return Buffer.from(bodyData, 'base64').toString('utf-8');
        };
        
        // Check if the email has a `text/plain` part
        const payload = emailResponse.data.payload;
        if (payload) {
          const parts = payload.parts || [payload];
        
          for (const part of parts) {
            // Check for plain text part
            if (part.mimeType === 'text/plain' && part.body?.data) {
              emailBody = decodeBody(part.body.data);
              break;
            }
        
            // If HTML exists but no plain text, consider HTML
            if (!emailBody && part.mimeType === 'text/html' && part.body?.data) {
              emailBody = decodeBody(part.body.data); // Handle HTML accordingly
            }
          }
        }

        if (!emailBody) {
            return NextResponse.json({ error: 'Failed to retrieve email body' }, { status: 500 });
        }

        // Step 2: Summarize the email body using Gemini
        const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Summarize the following email: ${emailBody}`;

        // Step 2: Summarize the email body using gemini
        const summary = await model.generateContent(prompt);

        console.log(summary)

        if (!summary || !summary?.response?.candidates) {
            return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
        }

        const text = summary?.response?.candidates[0].content.parts[0].text

        // Step 3: Return the summarized response
        return NextResponse.json({ summary: text });
    } catch (error) {
        console.error('Error summarizing email:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
    }
}
