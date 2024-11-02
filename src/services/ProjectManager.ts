import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const ProjectSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['frontend', 'backend', 'fullstack']),
  framework: z.string(),
  dependencies: z.array(z.string())
});

export class ProjectManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createProject(data: z.infer<typeof ProjectSchema>) {
    try {
      const validated = ProjectSchema.parse(data);
      return await this.prisma.project.create({
        data: validated
      });
    } catch (error) {
      throw new Error(`Project creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateDependencies(dependencies: string[]): Promise<boolean> {
    try {
      const results = await Promise.all(
        dependencies.map(async (dep) => {
          const response = await fetch(`https://registry.npmjs.org/${dep}/latest`);
          return response.ok;
        })
      );
      return results.every(Boolean);
    } catch (error) {
      throw new Error(`Dependency validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}