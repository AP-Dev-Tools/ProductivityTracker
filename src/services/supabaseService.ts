import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';

interface DataRow {
  id?: string;
  user_id: string;
  date: string;
  entries: Record<string, any[]>;
  plans: Record<string, any[]>;
  purpose_categories: any[];
  people: any[];
  updated_at?: string;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private initialized = false;

  constructor() {
    // Initialize with hardcoded credentials
    const supabaseUrl = 'https://onfvejeewoiyuegjpeid.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZnZlamVld29peXVlZ2pwZWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODgxOTksImV4cCI6MjA3ODQ2NDE5OX0.mBTlsRB3VdzAYRoPMqtVPGMS2tUWAzUSqcWR_W0iDGs';
    
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    this.initialized = true;
  }

  initialize(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    this.initialized = true;
    
    // Save config for future use
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_key', supabaseKey);
  }

  loadConfig(): boolean {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');
    
    if (!url || !key) return false;
    
    this.initialize(url, key);
    return true;
  }

  isInitialized(): boolean {
    return this.initialized && this.client !== null;
  }

  getClient(): SupabaseClient {
    if (!this.client) throw new Error('Supabase not initialized');
    return this.client;
  }

  async signInWithGoogle() {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      }
    });
    
    if (error) throw error;
    return data;
  }

  async signInWithEmail(email: string, password: string) {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  async signUpWithEmail(email: string, password: string) {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getSession(): Promise<Session | null> {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const { data: { session } } = await this.client.auth.getSession();
    return session;
  }

  async getCurrentUser() {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const { data: { user } } = await this.client.auth.getUser();
    return user;
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    if (!this.client) throw new Error('Supabase not initialized');
    
    return this.client.auth.onAuthStateChange(callback);
  }

  async loadUserData() {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.client
      .from('user_data')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    if (!data) {
      // No data yet, return defaults
      return {
        entries: {},
        plans: {},
        purposeCategories: [],
        people: [],
      };
    }

    return {
      entries: data.entries || {},
      plans: data.plans || {},
      purposeCategories: data.purpose_categories || [],
      people: data.people || [],
    };
  }

  async saveUserData(data: {
    entries: Record<string, any[]>;
    plans: Record<string, any[]>;
    purposeCategories: any[];
    people: any[];
  }) {
    if (!this.client) throw new Error('Supabase not initialized');
    
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const dataRow: DataRow = {
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      entries: data.entries,
      plans: data.plans,
      purpose_categories: data.purposeCategories,
      people: data.people,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.client
      .from('user_data')
      .upsert(dataRow, {
        onConflict: 'user_id',
      });

    if (error) throw error;
  }

  async updateEntries(entries: Record<string, any[]>) {
    const data = await this.loadUserData();
    data.entries = entries;
    await this.saveUserData(data);
  }

  async updatePlans(plans: Record<string, any[]>) {
    const data = await this.loadUserData();
    data.plans = plans;
    await this.saveUserData(data);
  }

  async updatePurposeCategories(categories: any[]) {
    const data = await this.loadUserData();
    data.purposeCategories = categories;
    await this.saveUserData(data);
  }

  async updatePeople(people: any[]) {
    const data = await this.loadUserData();
    data.people = people;
    await this.saveUserData(data);
  }
}

export const supabaseService = new SupabaseService();
