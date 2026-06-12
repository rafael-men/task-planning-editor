import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaybookHistorico } from '../models/playbook-historico.entity';
import { Playbook } from '../models/playbook.entity';
import {
  conteudoSchema,
  createPlaybookBody,
  promptBody,
  updatePlaybookBody,
} from '../lib/schemas';
import { LlmService } from './llm.service';

@Injectable()
export class PlaybooksService {
  constructor(
    @InjectRepository(Playbook)
    private readonly playbookRepo: Repository<Playbook>,
    @InjectRepository(PlaybookHistorico)
    private readonly historicoRepo: Repository<PlaybookHistorico>,
    private readonly llm: LlmService,
  ) {}

  async listar(ownerId: string) {
    return this.playbookRepo.find({
      where: { ownerId },
      select: { id: true, nome: true, descricao: true, versao: true, updatedAt: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async obter(id: string, ownerId: string) {
    const playbook = await this.playbookRepo.findOne({
      where: { id, ownerId },
    });
    if (!playbook) throw new NotFoundException('Playbook não encontrado.');
    return playbook;
  }

  async criar(body: unknown, ownerId: string) {
    const parsed = createPlaybookBody.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException(parsed.error.flatten());

    const playbook = this.playbookRepo.create({
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      conteudo: parsed.data.conteudo ?? { secoes: [] },
      ownerId,
    });
    return this.playbookRepo.save(playbook);
  }

  async atualizar(id: string, body: unknown, ownerId: string) {
    const parsed = updatePlaybookBody.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException(parsed.error.flatten());

    const atual = await this.playbookRepo.findOne({ where: { id, ownerId } });
    if (!atual) throw new NotFoundException('Playbook não encontrado.');

    if (parsed.data.conteudo) {
      const ok = conteudoSchema.safeParse(parsed.data.conteudo);
      if (!ok.success)
        throw new BadRequestException(ok.error.flatten());
    }

    await this.historicoRepo.save(
      this.historicoRepo.create({
        playbookId: atual.id,
        conteudo: atual.conteudo,
        versao: atual.versao,
        prompt: null,
      }),
    );

    if (parsed.data.nome !== undefined) atual.nome = parsed.data.nome;
    if (parsed.data.descricao !== undefined)
      atual.descricao = parsed.data.descricao;
    if (parsed.data.conteudo !== undefined)
      atual.conteudo = parsed.data.conteudo as Record<string, unknown>;
    atual.versao += 1;

    return this.playbookRepo.save(atual);
  }

  async remover(id: string, ownerId: string) {
    const playbook = await this.playbookRepo.findOne({
      where: { id, ownerId },
    });
    if (!playbook) throw new NotFoundException('Playbook não encontrado.');
    await this.playbookRepo.remove(playbook);
  }

  async previewPrompt(id: string, body: unknown, ownerId: string) {
    const parsed = promptBody.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException(parsed.error.flatten());

    const playbook = await this.playbookRepo.findOne({
      where: { id, ownerId },
      select: { id: true, conteudo: true },
    });
    if (!playbook) throw new NotFoundException('Playbook não encontrado.');

    const conteudoAtual = conteudoSchema.safeParse(playbook.conteudo);
    if (!conteudoAtual.success)
      throw new BadRequestException('Conteúdo armazenado fora do schema.');

    const novoConteudo = await this.llm.aplicarPromptNoConteudo(
      conteudoAtual.data,
      parsed.data.prompt,
    );
    return { antes: conteudoAtual.data, depois: novoConteudo };
  }
}
