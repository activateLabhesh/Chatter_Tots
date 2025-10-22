import { supabase } from "../client/supabase.js";

// Save a message to the messages table. Includes userName and channel.
export async function messagestore(userName: string, message: string, channel: string) {
    if (!channel) channel = 'general';
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([
                {
                    username: userName,
                    message: message,
                    channelId: channel,
                },
            ])
            .select();

        if (error) {
            console.error('Error saving message:', error);
            return null;
        }
        return data;
    } catch (err) {
        console.error('Unexpected error saving message:', err);
        return null;
    }
}

// Retrieve messages for a channel. Returns an array ordered by created_at ascending.
export async function retrievemessages(channel: string, limit: number = 100) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('channelId', channel)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('Unexpected error fetching messages:', err);
        return [];
    }
}



