import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createChatMessagesCollection, insertChatMessages } from '@/lib/db';

// Manual chat parsing function for fallback
function parseChatManually(content: string) {
  const messages = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Try different chat formats
    // Format 1: [timestamp] sender: message
    let match = trimmedLine.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.+)$/);
    if (match) {
      messages.push({
        sender: match[2].trim(),
        timestamp: match[1].trim(),
        message: match[3].trim()
      });
      continue;
    }
    
    // Format 2: timestamp sender: message
    match = trimmedLine.match(/^([^\s]+)\s+([^:]+):\s*(.+)$/);
    if (match) {
      messages.push({
        sender: match[2].trim(),
        timestamp: match[1].trim(),
        message: match[3].trim()
      });
      continue;
    }
    
    // Format 3: sender: message (no timestamp)
    match = trimmedLine.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      messages.push({
        sender: match[1].trim(),
        timestamp: 'Unknown',
        message: match[2].trim()
      });
      continue;
    }
  }
  
  return messages;
}

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
    if (fileContent.length > 50000) { // 50KB limit to prevent timeouts
      return NextResponse.json(
        { error: 'File content too large. Please use a smaller file (max 50KB).' },
        { status: 400 }
      );
    }

    // Create the database collection if it doesn't exist
    await createChatMessagesCollection();

    // Process the file content with OpenAI
    const prompt = `You are a chat log parser. Parse the following chat log text and extract structured data. 

CRITICAL INSTRUCTIONS:
- You MUST return ONLY a valid JSON array
- NO explanations, NO markdown, NO code blocks, NO additional text
- Start your response with [ and end with ]
- Each object must have exactly these three fields: sender, timestamp, message

Required JSON structure for each message:
{
  "sender": "string (name of the person who sent the message)",
  "timestamp": "string (timestamp or time of the message)", 
  "message": "string (the actual message content)"
}

Parsing rules:
1. Extract ALL messages from the chat log
2. If timestamp is not available, use "Unknown" as the value
3. If sender is not available, use "Unknown" as the value
4. Clean up the message content (remove extra whitespace, but preserve line breaks within messages)
5. Ensure all JSON is properly escaped and valid
6. Return ONLY the JSON array - nothing else

Example of expected output format:
[
  {
    "sender": "Alice",
    "timestamp": "2024-01-15 10:30:15",
    "message": "Hey everyone! How's the project going?"
  },
  {
    "sender": "Bob", 
    "timestamp": "2024-01-15 10:31:22",
    "message": "Good morning! I've been working on the database schema."
  }
]

Chat log content to parse:
${fileContent}`;

    let responseText;
    const models = ["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4"]; // Fallback models
    let lastError;
    
    for (const model of models) {
      // Create a new AbortController for each model attempt
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`Timeout for model ${model}, aborting request`);
        controller.abort();
      }, 30000); // 30 second timeout per model
      
      try {
        console.log(`Attempting to use model: ${model}`);
        
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
          max_tokens: 2000, // Further reduced for faster response
        }, {
          signal: controller.signal,
          timeout: 25000, // 25 second timeout
        });

        clearTimeout(timeoutId);
        responseText = completion.choices[0]?.message?.content;
        
        if (responseText) {
          console.log(`Successfully used model: ${model}`);
          break; // Success, exit the loop
        }
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`Model ${model} failed:`, errorMessage);
        
        // Check if it's a timeout/abort error
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
          console.log(`Model ${model} timed out, trying next model...`);
          continue; // Try next model
        }
        
        // If it's an access error, try the next model
        if (error instanceof Error && error.message.includes('does not exist or you do not have access')) {
          console.log(`Model ${model} not accessible, trying next model...`);
          continue;
        }
        
        // If it's a rate limit error, wait a bit and try next model
        if (error instanceof Error && error.message.includes('rate limit')) {
          console.log(`Rate limit hit for model ${model}, trying next model...`);
          continue;
        }
        
        // For other errors, try next model
        console.log(`Other error with model ${model}, trying next model...`);
        continue;
      }
    }
    
    if (!responseText) {
      console.log('All AI models failed, attempting fallback parsing...');
      
      // Fallback: Try to parse the chat manually for simple formats
      try {
        const fallbackMessages = parseChatManually(fileContent);
        if (fallbackMessages.length > 0) {
          console.log(`Fallback parsing successful, found ${fallbackMessages.length} messages`);
          
          // Insert messages into database
          const insertedMessages = await insertChatMessages(fallbackMessages);
          
          return NextResponse.json({
            success: true,
            message: `Successfully processed ${insertedMessages.length} messages using fallback parsing`,
            data: insertedMessages,
            fallback: true
          });
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
      }
      
      if (lastError instanceof Error && lastError.name === 'AbortError') {
        throw new Error('Request timeout - file processing took too long. Please try with a smaller file.');
      }
      throw new Error(`All models failed. Last error: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`);
    }

    // Parse the JSON response
    let parsedMessages;
    try {
      // Log the raw response for debugging
      console.log('Raw OpenAI response:', responseText);
      console.log('Response length:', responseText.length);
      console.log('Response type:', typeof responseText);
      
      // Clean up the response if it contains markdown formatting
      let cleanedResponse = responseText.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing whitespace
      cleanedResponse = cleanedResponse.trim();
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      // Additional cleanup for common issues
      cleanedResponse = cleanedResponse
        .replace(/^[^{[]*/, '') // Remove any text before the JSON
        .replace(/[^}\]]*$/, '') // Remove any text after the JSON
        .trim();
      
      console.log('Cleaned response:', cleanedResponse);
      
      parsedMessages = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:');
      console.error('Raw response:', responseText);
      console.error('Parse error:', parseError);
      
      // Try to provide a more helpful error message
      let errorMessage = 'Invalid JSON response from OpenAI.';
      if (responseText.includes('```')) {
        errorMessage += ' The response appears to contain markdown formatting that could not be parsed.';
      } else if (!responseText.includes('[') || !responseText.includes(']')) {
        errorMessage += ' The response does not appear to contain a JSON array.';
      } else {
        errorMessage += ' The JSON structure is malformed.';
      }
      
      errorMessage += ` Raw response preview: ${responseText.substring(0, 300)}...`;
      
      // Try one more fallback: attempt to manually construct JSON from the response
      try {
        console.log('Attempting fallback JSON construction...');
        const fallbackMessages = [];
        const lines = responseText.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine && (trimmedLine.includes('sender') || trimmedLine.includes('timestamp') || trimmedLine.includes('message'))) {
            // Try to extract key-value pairs from the line
            const senderMatch = trimmedLine.match(/"sender":\s*"([^"]*)"/);
            const timestampMatch = trimmedLine.match(/"timestamp":\s*"([^"]*)"/);
            const messageMatch = trimmedLine.match(/"message":\s*"([^"]*)"/);
            
            if (senderMatch || timestampMatch || messageMatch) {
              fallbackMessages.push({
                sender: senderMatch ? senderMatch[1] : 'Unknown',
                timestamp: timestampMatch ? timestampMatch[1] : 'Unknown',
                message: messageMatch ? messageMatch[1] : ''
              });
            }
          }
        }
        
        if (fallbackMessages.length > 0) {
          console.log('Fallback parsing successful, found', fallbackMessages.length, 'messages');
          parsedMessages = fallbackMessages;
        } else {
          throw new Error(errorMessage);
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
        throw new Error(errorMessage);
      }
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
