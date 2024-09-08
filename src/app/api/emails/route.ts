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
    const emailDetailsPromises = emailIds
      .filter((id): id is string => id !== null && id !== undefined)
      .map(id =>
        gmail.users.messages.get({
          userId: 'me',
          id,
          format: 'full',
        }).then((res: any) => {
          const headers = res.data.payload?.headers || [];
          const subjectHeader = headers.find((header: { name: string; value: string }) => header.name === 'Subject');

          // Function to decode base64 encoded body
          const decodeBody = (body: string) => Buffer.from(body, 'base64').toString('utf-8');

          // Extract body
          let body = '';
          if (res.data.payload?.body?.data) {
            body = decodeBody(res.data.payload.body.data);
          } else if (res.data.payload?.parts) {
            const textPart = res.data.payload.parts.find((part: any) => part.mimeType === 'text/plain');
            if (textPart && textPart.body?.data) {
              body = decodeBody(textPart.body.data);
            }
          }

          return {
            id,
            subject: subjectHeader?.value || 'No Subject',
            body: body || 'No body content',
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

// New POST method to reply to an email
export async function POST(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.split(' ')[1];

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token provided' }, { status: 401 });
  }

  try {
    const { emailId, replyBody } = await req.json();

    if (!emailId || !replyBody) {
      return NextResponse.json({ error: 'Email ID and reply body are required' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch the original email to get the subject and thread ID
    const originalEmail = await gmail.users.messages.get({
      userId: 'me',
      id: emailId,
    });
    const headers = originalEmail.data.payload?.headers || [];
    const subject = headers.find(header => header.name?.toLowerCase() === 'subject')?.value || 'Re: ';
    const from = headers.find(header => header.name?.toLowerCase() === 'from')?.value;
    const to = headers.find(header => header.name?.toLowerCase() === 'to')?.value;

    // Use the 'from' address as the recipient for the reply
    const recipient = from || to;

    if (!recipient) {
      return NextResponse.json({ error: 'No valid recipient found' }, { status: 400 });
    }

    const threadId = originalEmail.data.threadId;

    // Construct the reply email
    const replyEmail = [
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      'Content-Transfer-Encoding: 7bit',
      `Subject: ${subject.startsWith('Re:') ? subject : 'Re: ' + subject}`,
      'From: me',
      `To: ${recipient}`,
      `In-Reply-To: ${emailId}`,
      `References: ${emailId}`,
      '',
      replyBody
    ].join('\r\n');

    // Send the reply
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(replyEmail).toString('base64url'),
        threadId: threadId,
      },
    });

    return NextResponse.json({ message: 'Reply sent successfully', id: response.data.id });
  } catch (error) {
    console.error('Error sending reply:', error);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}