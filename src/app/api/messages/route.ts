import { NextRequest, NextResponse } from 'next/server';
import { getAllChatMessages, getChatMessagesBySender } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sender = searchParams.get('sender');

    let messages;
    
    if (sender) {
      messages = await getChatMessagesBySender(sender);
    } else {
      messages = await getAllChatMessages();
    }

    return NextResponse.json({
      success: true,
      data: messages,
      count: messages.length
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
