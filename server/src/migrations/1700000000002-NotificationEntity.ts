import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationEntity1700000000002 implements MigrationInterface {
  name = 'NotificationEntity1700000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      create table if not exists pmo.notification (
        id          uuid primary key default gen_random_uuid(),
        owner_id    uuid not null references auth.users(id) on delete cascade,
        title       text not null,
        body        text,
        read        boolean not null default false,
        created_at  timestamptz not null default now()
      )
    `);

    await queryRunner.query(`
      create index if not exists notification_owner_id_idx
        on pmo.notification(owner_id)
    `);

    await queryRunner.query(`
      create index if not exists notification_owner_created_at_idx
        on pmo.notification(owner_id, created_at desc)
    `);

    await queryRunner.query(`alter table pmo.notification enable row level security`);

    await queryRunner.query(`
      drop policy if exists "notification owner select" on pmo.notification;
      create policy "notification owner select" on pmo.notification
        for select using (auth.uid() = owner_id)
    `);
    await queryRunner.query(`
      drop policy if exists "notification owner insert" on pmo.notification;
      create policy "notification owner insert" on pmo.notification
        for insert with check (auth.uid() = owner_id)
    `);
    await queryRunner.query(`
      drop policy if exists "notification owner update" on pmo.notification;
      create policy "notification owner update" on pmo.notification
        for update using (auth.uid() = owner_id)
    `);
    await queryRunner.query(`
      drop policy if exists "notification owner delete" on pmo.notification;
      create policy "notification owner delete" on pmo.notification
        for delete using (auth.uid() = owner_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop table if exists pmo.notification`);
  }
}
