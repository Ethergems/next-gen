import { DependencyValidationService } from './DependencyValidationService';
import { ErrorCheckingService } from './ErrorCheckingService';
import { ProjectValidationService } from './ProjectValidationService';
import { AIService } from './AIService';

export class ValidationManager {
  private static instance: ValidationManager;
  private depValidator: DependencyValidationService;
  private errorChecker: ErrorCheckingService;
  private projectValidator: ProjectValidationService;
  private aiService: AIService;

  private constructor() {
    this.depValidator = new DependencyValidationService();
    this.errorChecker = new ErrorCheckingService();
    this.projectValidator = new ProjectValidationService();
    this.aiService = new AIService();
  }

  static getInstance(): ValidationManager {
    if (!ValidationManager.instance) {
      ValidationManager.instance = new ValidationManager();
    }
    return ValidationManager.instance;
  }

  async validateEverything(): Promise<{
    valid: boolean;
    errors: any[];
    fixes: string[];
  }> {
    const results = {
      valid: true,
      errors: [],
      fixes: []
    };

    try {
      // 1. Environment Check
      const envCheck = await this.validateEnvironment();
      if (!envCheck.valid) {
        results.valid = false;
        results.errors.push(...envCheck.errors);
        results.fixes.push(...envCheck.fixes);
      }

      // 2. Dependency Check
      const depCheck = await this.depValidator.validateDependencies();
      if (!depCheck.valid) {
        results.valid = false;
        results.errors.push(...depCheck.errors);
        if (depCheck.fixes) {
          results.fixes.push(...depCheck.fixes);
        }
      }

      // 3. API Keys Check
      const apiCheck = this.validateAPIKeys();
      if (!apiCheck.valid) {
        results.valid = false;
        results.errors.push(...apiCheck.errors);
        results.fixes.push(...apiCheck.fixes);
      }

      // 4. Project Structure Check
      const structureCheck = await this.projectValidator.validateProject();
      if (!structureCheck.valid) {
        results.valid = false;
        results.errors.push(...Object.values(structureCheck.errors).flat());
        if (structureCheck.fixes) {
          results.fixes.push(...structureCheck.fixes);
        }
      }

      return results;
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        fixes: ['Run validation again after fixing reported errors']
      };
    }
  }

  private async validateEnvironment() {
    const results = {
      valid: true,
      errors: [] as string[],
      fixes: [] as string[]
    };

    // Check Node.js version
    const nodeVersion = process.version;
    if (!nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v20')) {
      results.valid = false;
      results.errors.push(`Node.js version ${nodeVersion} is not supported`);
      results.fixes.push('Update Node.js to version 18 or 20');
    }

    // Check required global dependencies
    const requiredGlobals = ['typescript', 'vite'];
    for (const dep of requiredGlobals) {
      try {
        await import(dep);
      } catch {
        results.valid = false;
        results.errors.push(`Missing global dependency: ${dep}`);
        results.fixes.push(`Install ${dep} globally: npm install -g ${dep}`);
      }
    }

    return results;
  }

  private validateAPIKeys() {
    const results = {
      valid: true,
      errors: [] as string[],
      fixes: [] as string[]
    };

    const requiredKeys = {
      'E2B_API_KEY': process.env.E2B_API_KEY,
      'DEEP_AI_API_KEY': process.env.DEEP_AI_API_KEY,
      'HUGGING_FACE_API_KEY': process.env.HUGGING_FACE_API_KEY,
      'TOGETHER_API_KEY': process.env.TOGETHER_API_KEY
    };

    for (const [key, value] of Object.entries(requiredKeys)) {
      if (!value) {
        results.valid = false;
        results.errors.push(`Missing API key: ${key}`);
        results.fixes.push(`Add ${key} to your .env file`);
      }
    }

    return results;
  }

  async fixAll(): Promise<boolean> {
    try {
      const validation = await this.validateEverything();
      
      if (validation.valid) {
        return true;
      }

      // Apply all fixes
      for (const fix of validation.fixes) {
        if (fix.startsWith('npm install')) {
          await this.executeCommand(fix);
        } else if (fix.includes('Add') && fix.includes('to your .env')) {
          // Handle .env fixes
          await this.updateEnvFile(fix);
        }
      }

      // Validate again after fixes
      const finalValidation = await this.validateEverything();
      return finalValidation.valid;
    } catch (error) {
      console.error('Error during fix process:', error);
      return false;
    }
  }

  private async executeCommand(command: string): Promise<void> {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(command, (error: Error | null) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private async updateEnvFile(fix: string): Promise<void> {
    // Implementation for updating .env file
    // This would be implemented based on the specific requirements
  }
}