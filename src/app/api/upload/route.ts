import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createChatMessagesCollection, insertChatMessages } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check if file is a text file
    if (!file.name.endsWith('.txt')) {
      return NextResponse.json(
        { error: 'Only .txt files are allowed' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    if (!fileContent.trim()) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // Create the database collection if it doesn't exist
    await createChatMessagesCollection();

    // Process the file content with OpenAI
    const prompt = `You are a chat log parser. Parse the following chat log text and extract structured data. 

Return ONLY a valid JSON array where each object has the following structure:
{
  "sender": "string (name of the person who sent the message)",
  "timestamp": "string (timestamp or time of the message)",
  "message": "string (the actual message content)"
}

Rules:
1. Extract ALL messages from the chat log
2. If timestamp is not available, use "Unknown" as the value
3. If sender is not available, use "Unknown" as the value
4. Clean up the message content (remove extra whitespace, but preserve line breaks within messages)
5. Return ONLY the JSON array, no other text or explanation
6. Ensure the JSON is valid and properly formatted

Chat log content:
${fileContent}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that parses chat logs and returns structured JSON data. Always return valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let parsedMessages;
    try {
      parsedMessages = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate the parsed data
    if (!Array.isArray(parsedMessages)) {
      throw new Error('Expected an array of messages');
    }

    // Validate each message has required fields
    const validatedMessages = parsedMessages.map((msg, index) => {
      if (!msg || typeof msg !== 'object') {
        throw new Error(`Invalid message at index ${index}`);
      }
      
      return {
        sender: msg.sender || 'Unknown',
        timestamp: msg.timestamp || 'Unknown',
        message: msg.message || ''
      };
    });

    // Insert messages into database
    const insertedMessages = await insertChatMessages(validatedMessages);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${insertedMessages.length} messages`,
      data: insertedMessages
    });

  } catch (error) {
    console.error('Error processing file:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
