import { Request, Response } from 'express';
import { promptService } from '../services/promptService';
import { promptExecutionService } from '../services/promptExecutionService';
import { CreatePromptDto, UpdatePromptDto, ExecutePromptDto } from '../types';
import { PromptType, PromptExecutionStatus } from '@prisma/client';

export const promptController = {
  async create(req: Request, res: Response) {
    const userId = req.user!.id;
    const data: CreatePromptDto = req.body;

    const prompt = await promptService.create(userId, data);
    res.status(201).json(prompt);
  },

  async findAll(req: Request, res: Response) {
    const userId = req.user!.id;
    const {
      type,
      search,
      limit = '20',
      offset = '0',
      orderBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const result = await promptService.findAll(userId, {
      type: type as PromptType | undefined,
      search: search as string | undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      orderBy: orderBy as any,
      order: order as 'asc' | 'desc',
    });

    res.json(result);
  },

  async findById(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const prompt = await promptService.findById(id, userId);
    res.json(prompt);
  },

  async update(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    const data: UpdatePromptDto = req.body;

    const prompt = await promptService.update(id, userId, data);
    res.json(prompt);
  },

  async delete(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    await promptService.delete(id, userId);
    res.status(204).send();
  },

  async clone(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const prompt = await promptService.clone(id, userId);
    res.status(201).json(prompt);
  },

  // Execution endpoints
  async execute(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    const { parameters }: ExecutePromptDto = req.body;

    const execution = await promptExecutionService.execute(id, userId, parameters);
    res.status(201).json(execution);
  },

  async getExecutions(req: Request, res: Response) {
    const userId = req.user!.id;
    const {
      promptId,
      status,
      limit = '20',
      offset = '0',
    } = req.query;

    const result = await promptExecutionService.findAll(userId, {
      promptId: promptId as string | undefined,
      status: status as PromptExecutionStatus | undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json(result);
  },

  async getExecution(req: Request, res: Response) {
    const userId = req.user!.id;
    const { executionId } = req.params;

    const execution = await promptExecutionService.findById(executionId, userId);
    res.json(execution);
  },

  async cancelExecution(req: Request, res: Response) {
    const userId = req.user!.id;
    const { executionId } = req.params;

    await promptExecutionService.cancel(executionId, userId);
    res.status(204).send();
  },
};