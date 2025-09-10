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

    // Check MongoDB connection
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
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

    // Check file size (Vercel limit: 4.5MB)
    const maxSize = 4 * 1024 * 1024; // 4MB to be safe
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 4MB.' },
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

    // Check content length to prevent excessive processing
    if (fileContent.length > 100000) { // 100KB limit
      return NextResponse.json(
        { error: 'File content too large. Please use a smaller file.' },
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

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    let responseText;
    const models = ["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4"]; // Fallback models
    let lastError;
    
    for (const model of models) {
      try {
        const completion = await openai.chat.completions.create({
          model: model,
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
          max_tokens: 3000, // Reduced for faster response
        }, {
          signal: controller.signal,
          timeout: 20000, // 20 second timeout
        });

        responseText = completion.choices[0]?.message?.content;
        
        if (responseText) {
          console.log(`Successfully used model: ${model}`);
          break; // Success, exit the loop
        }
      } catch (error) {
        lastError = error;
        console.warn(`Model ${model} failed:`, error instanceof Error ? error.message : 'Unknown error');
        
        // If it's an access error, try the next model
        if (error instanceof Error && error.message.includes('does not exist or you do not have access')) {
          continue;
        }
        
        // For other errors, break and throw
        break;
      }
    }
    
    clearTimeout(timeoutId);
    
    if (!responseText) {
      if (lastError instanceof Error && lastError.name === 'AbortError') {
        throw new Error('Request timeout - file processing took too long');
      }
      throw new Error(`All models failed. Last error: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`);
    }

    // Parse the JSON response
    let parsedMessages;
    try {
      parsedMessages = JSON.parse(responseText);
    } catch {
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
