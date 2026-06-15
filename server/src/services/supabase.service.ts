import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private adminClient!: SupabaseClient<any, any, any>;
  private anonClient!: SupabaseClient<any, any, any>;

  onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!url || !serviceKey || !anonKey) {
      throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_ANON_KEY são obrigatórios.');
    }

    this.adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'pmo' },
    });

    this.anonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  get admin(): SupabaseClient<any, any, any> {
    return this.adminClient;
  }

  async validateToken(token: string) {
    const { data, error } = await this.anonClient.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user;
  }

  async getUserById(userId: string) {
    const { data, error } = await this.adminClient.auth.admin.getUserById(userId);
    if (error || !data.user) return null;
    return data.user;
  }

  
  async getUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const results = await Promise.all(ids.map((id) => this.getUserById(id)));
    return results.filter((u): u is User => u !== null);
  }

  async listUsers(): Promise<User[]> {
    const all: User[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await this.adminClient.auth.admin.listUsers({ perPage: 200, page });
      if (error) throw new Error(error.message);
      all.push(...data.users);
      if (data.users.length < 200) break;
      page++;
    }
    return all;
  }

  async updateUser(userId: string, patch: { email?: string; user_metadata?: Record<string, unknown> }) {
    const { data, error } = await this.adminClient.auth.admin.updateUserById(userId, patch);
    if (error || !data.user) throw new Error(error?.message || 'Falha ao atualizar usuário.');
    return data.user;
  }
}
