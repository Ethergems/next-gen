import { z } from 'zod';
import { DependencyValidationService, ValidationMode } from './DependencyValidationService';
import { ErrorCheckingService } from './ErrorCheckingService';
import { ProjectManager } from './ProjectManager';

export class ProjectValidationService {
  private dependencyValidator: DependencyValidationService;
  private errorChecker: ErrorCheckingService;
  private projectManager: ProjectManager;

  constructor() {
    this.dependencyValidator = new DependencyValidationService();
    this.errorChecker = new ErrorCheckingService();
    this.projectManager = new ProjectManager();
  }

  setValidationMode(mode: ValidationMode) {
    this.dependencyValidator.setMode(mode);
  }

  async validateProject(): Promise<{
    valid: boolean;
    errors: {
      dependencies?: string[];
      code?: string[];
      structure?: string[];
    };
    fixes?: string[];
  }> {
    const results = {
      valid: true,
      errors: {},
      fixes: []
    };

    // Validate dependencies
    const depValidation = await this.dependencyValidator.validateDependencies();
    if (!depValidation.valid) {
      results.valid = false;
      results.errors.dependencies = depValidation.errors;
      if (depValidation.fixes) {
        results.fixes.push(...depValidation.fixes);
      }
    }

    // Validate project structure
    const structureValidation = await this.validateProjectStructure();
    if (!structureValidation.valid) {
      results.valid = false;
      results.errors.structure = structureValidation.errors;
    }

    return results;
  }

  private async validateProjectStructure(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'index.html',
      'src/main.tsx',
      'src/App.tsx'
    ];

    for (const file of requiredFiles) {
      try {
        await Deno.stat(file);
      } catch {
        errors.push(`Missing required file: ${file}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}