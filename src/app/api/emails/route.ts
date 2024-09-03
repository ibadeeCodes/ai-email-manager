import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Function to fetch email data with subjects
export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.split(' ')[1];

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token provided' }, { status: 401 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch the list of email IDs
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10, // Adjust as needed
    });

    const emailIds = listResponse.data.messages?.map(msg => msg.id) || [];

    // Fetch detailed email data for each email ID
    const emailDetailsPromises = emailIds.map(id =>
      gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'full',
      }).then((res: any) => {
        const headers = res.data.payload?.headers || [];
        const subjectHeader = headers.find((header: { name: string; value: string }) => header.name === 'Subject');
        return {
          id,
          subject: subjectHeader?.value || 'No Subject',
        };
      })
    );

    const emailDetails = await Promise.all(emailDetailsPromises);

    return NextResponse.json(emailDetails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}
