import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Promove um usuário existente a admin master.
 *   Defina a variável de ambiente ADMIN_EMAIL com o e-mail do usuário
 *   que já deve estar cadastrado no Supabase Auth.
 *   ADMIN_EMAIL=seu@email.com npm run migration:run
 */

export class AdminMaster1700000000001 implements MigrationInterface {
  name = 'AdminMaster1700000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    const email = process.env.ADMIN_EMAIL;
    if (!email) {
      throw new Error(
        'ADMIN_EMAIL não definido. Execute: ADMIN_EMAIL=seu@email.com npm run migration:run',
      );
    }

    const result = await queryRunner.query(
      `select id from auth.users where email = $1 limit 1`,
      [email],
    );

    if (!result.length) {
      throw new Error(
        `Usuário com e-mail "${email}" não encontrado em auth.users. Cadastre-se primeiro.`,
      );
    }

    const userId = result[0].id;

    await queryRunner.query(
      `
      insert into pmo.perfis_usuario (user_id, role, created_at, updated_at)
      values ($1, 'admin', now(), now())
      on conflict (user_id) do update
        set role       = 'admin',
            updated_at = now()
      `,
      [userId],
    );

    console.log(`✓ Usuário ${email} (${userId}) promovido a admin.`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const email = process.env.ADMIN_EMAIL;
    if (!email) return;

    await queryRunner.query(
      `
      update pmo.perfis_usuario
         set role       = 'lider',
             updated_at = now()
       where user_id = (select id from auth.users where email = $1 limit 1)
      `,
      [email],
    );
  }
}
