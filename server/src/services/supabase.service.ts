import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private adminClient: SupabaseClient<any, any, any>;
  private anonClient: SupabaseClient<any, any, any>;

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

  async listUsers(perPage = 200) {
    const { data, error } = await this.adminClient.auth.admin.listUsers({ perPage });
    if (error) throw new Error(error.message);
    return data.users;
  }

  async updateUser(userId: string, patch: { email?: string; user_metadata?: Record<string, unknown> }) {
    const { data, error } = await this.adminClient.auth.admin.updateUserById(userId, patch);
    if (error || !data.user) throw new Error(error?.message || 'Falha ao atualizar usuário.');
    return data.user;
  }
}
