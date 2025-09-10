import { MongoClient, Db, Collection } from 'mongodb';

export interface ChatMessage {
  _id?: string;
  sender: string;
  timestamp: string;
  message: string;
  created_at: Date;
}

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db(process.env.MONGODB_DATABASE || 'chat_parser');
    console.log('Connected to MongoDB successfully');
    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export async function getChatMessagesCollection(): Promise<Collection<ChatMessage>> {
  const { db } = await connectToDatabase();
  return db.collection<ChatMessage>('chat_messages');
}

export async function createChatMessagesCollection() {
  try {
    const collection = await getChatMessagesCollection();
    
    // Create index on created_at for better query performance
    await collection.createIndex({ created_at: -1 });
    
    // Create index on sender for filtering
    await collection.createIndex({ sender: 1 });
    
    console.log('Chat messages collection and indexes created successfully');
  } catch (error) {
    console.error('Error creating chat messages collection:', error);
    throw error;
  }
}

export async function insertChatMessages(messages: Omit<ChatMessage, '_id' | 'created_at'>[]) {
  try {
    const collection = await getChatMessagesCollection();
    
    const messagesWithTimestamps = messages.map(msg => ({
      ...msg,
      created_at: new Date()
    }));
    
    const result = await collection.insertMany(messagesWithTimestamps);
    
    // Return the inserted documents
    const insertedIds = Object.values(result.insertedIds);
    const insertedMessages = await collection.find({ _id: { $in: insertedIds } }).toArray();
    
    return insertedMessages;
  } catch (error) {
    console.error('Error inserting chat messages:', error);
    throw error;
  }
}

export async function getAllChatMessages(): Promise<ChatMessage[]> {
  try {
    const collection = await getChatMessagesCollection();
    
    const messages = await collection
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    return messages;
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
}

export async function getChatMessagesBySender(sender: string): Promise<ChatMessage[]> {
  try {
    const collection = await getChatMessagesCollection();
    
    const messages = await collection
      .find({ sender })
      .sort({ created_at: -1 })
      .toArray();
    
    return messages;
  } catch (error) {
    console.error('Error fetching chat messages by sender:', error);
    throw error;
  }
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}