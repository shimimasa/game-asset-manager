import { Request, Response } from 'express';
import { projectService } from '../services/projectService';
import { CreateProjectDto, UpdateProjectDto, AddAssetToProjectDto } from '../types';

export const projectController = {
  async create(req: Request, res: Response) {
    const userId = req.user!.id;
    const data: CreateProjectDto = req.body;

    const project = await projectService.create(userId, data);
    res.status(201).json(project);
  },

  async findAll(req: Request, res: Response) {
    const userId = req.user!.id;
    const {
      search,
      limit = '20',
      offset = '0',
      orderBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const result = await projectService.findAll(userId, {
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

    const project = await projectService.findById(id, userId);
    res.json(project);
  },

  async update(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    const data: UpdateProjectDto = req.body;

    const project = await projectService.update(id, userId, data);
    res.json(project);
  },

  async delete(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    await projectService.delete(id, userId);
    res.status(204).send();
  },

  async addAsset(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    const { assetId }: AddAssetToProjectDto = req.body;

    await projectService.addAsset(id, assetId, userId);
    res.status(201).json({ message: 'Asset added to project' });
  },

  async removeAsset(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id, assetId } = req.params;

    await projectService.removeAsset(id, assetId, userId);
    res.status(204).send();
  },

  async getAssets(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      limit = '50',
      offset = '0',
    } = req.query;

    const result = await projectService.getAssets(id, userId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json(result);
  },

  async duplicate(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const project = await projectService.duplicate(id, userId);
    res.status(201).json(project);
  },
};