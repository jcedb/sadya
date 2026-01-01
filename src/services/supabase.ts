// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '../types/database.types';

const supabaseUrl = 'https://lygrmcwdzmxvoufhqmdz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Z3JtY3dkem14dm91ZmhxbWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTAwMTYsImV4cCI6MjA4MjY2NjAxNn0.4NxNHxhSfNqexNxajHTVq0Eu0Yphg6Ys74BjqEgYv7M';

// Custom storage adapter for React Native using expo-secure-store
// Handles values larger than 2048 bytes by chunking
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const item = await SecureStore.getItemAsync(key);

      // Check if this is a chunked value
      if (item && item.startsWith('__{{CHUNKED}}__')) {
        const count = parseInt(item.split('::')[1], 10);
        let fullValue = '';
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
          if (chunk) fullValue += chunk;
        }
        return fullValue;
      }
      return item;
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const MAX_SIZE = 2000; // Leave buffer for overhead
      if (value.length > MAX_SIZE) {
        const chunkCount = Math.ceil(value.length / MAX_SIZE);
        // Store metadata in the main key
        await SecureStore.setItemAsync(key, `__{{CHUNKED}}__::${chunkCount}`);

        // Store chunks
        for (let i = 0; i < chunkCount; i++) {
          const chunk = value.slice(i * MAX_SIZE, (i + 1) * MAX_SIZE);
          await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk);
        }
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch {
      // Handle storage error silently
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      // Check if it was chunked to clean up parts
      const item = await SecureStore.getItemAsync(key);
      if (item && item.startsWith('__{{CHUNKED}}__')) {
        const count = parseInt(item.split('::')[1], 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
        }
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Handle storage error silently
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
