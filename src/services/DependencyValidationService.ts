import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type ValidationMode = 'strict' | 'auto-fix' | 'post-review';

export class DependencyValidationService {
  private mode: ValidationMode = 'strict';

  setMode(mode: ValidationMode) {
    this.mode = mode;
  }

  async validateDependencies(): Promise<{
    valid: boolean;
    errors: string[];
    fixes?: string[];
  }> {
    try {
      const result = await execAsync('npm ls --json');
      const dependencies = JSON.parse(result.stdout);
      const errors = this.findDependencyErrors(dependencies);

      if (errors.length === 0) {
        return { valid: true, errors: [] };
      }

      switch (this.mode) {
        case 'strict':
          return { valid: false, errors };
        
        case 'auto-fix':
          const fixes = await this.autoFixDependencies(errors);
          return { valid: true, errors, fixes };
        
        case 'post-review':
          return { 
            valid: false, 
            errors,
            fixes: this.suggestFixes(errors)
          };
      }
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private findDependencyErrors(dependencies: any): string[] {
    const errors: string[] = [];
    
    // Check for missing dependencies
    if (dependencies.problems) {
      errors.push(...dependencies.problems);
    }

    // Check for version conflicts
    this.checkVersionConflicts(dependencies, errors);

    return errors;
  }

  private checkVersionConflicts(deps: any, errors: string[], path: string[] = []) {
    if (!deps.dependencies) return;

    Object.entries(deps.dependencies).forEach(([name, info]: [string, any]) => {
      if (info.problems) {
        errors.push(`${path.join(' > ')} > ${name}: ${info.problems.join(', ')}`);
      }
      
      if (info.dependencies) {
        this.checkVersionConflicts(info, errors, [...path, name]);
      }
    });
  }

  private async autoFixDependencies(errors: string[]): Promise<string[]> {
    const fixes: string[] = [];
    
    for (const error of errors) {
      if (error.includes('missing:')) {
        const pkg = error.match(/missing: ([^@\s]+)/)?.[1];
        if (pkg) {
          try {
            await execAsync(`npm install ${pkg}`);
            fixes.push(`Installed missing package: ${pkg}`);
          } catch (e) {
            fixes.push(`Failed to install ${pkg}`);
          }
        }
      } else if (error.includes('peer dep missing:')) {
        const pkg = error.match(/peer dep missing: ([^@\s]+)/)?.[1];
        if (pkg) {
          try {
            await execAsync(`npm install ${pkg}`);
            fixes.push(`Installed peer dependency: ${pkg}`);
          } catch (e) {
            fixes.push(`Failed to install peer dependency ${pkg}`);
          }
        }
      }
    }

    return fixes;
  }

  private suggestFixes(errors: string[]): string[] {
    return errors.map(error => {
      if (error.includes('missing:')) {
        const pkg = error.match(/missing: ([^@\s]+)/)?.[1];
        return `Run: npm install ${pkg}`;
      } else if (error.includes('peer dep missing:')) {
        const pkg = error.match(/peer dep missing: ([^@\s]+)/)?.[1];
        return `Run: npm install ${pkg}`;
      }
      return `Manual review needed: ${error}`;
    });
  }
}