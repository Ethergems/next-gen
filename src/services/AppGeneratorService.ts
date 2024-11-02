import { z } from 'zod';
import { ProjectManager } from './ProjectManager';
import { ValidationManager } from './ValidationManager';
import { AIService } from './AIService';

export type AppTemplate = 'frontend' | 'backend' | 'fullstack' | 'desktop';
export type Framework = 
  // Frontend Frameworks
  | 'react' 
  | 'vue' 
  | 'angular' 
  | 'svelte' 
  | 'solid'
  | 'qwik'
  | 'lit'
  // Backend Frameworks
  | 'express' 
  | 'nest' 
  | 'fastify'
  | 'hapi'
  | 'koa'
  // Desktop Frameworks
  | 'electron'
  | 'tauri';

const AppConfigSchema = z.object({
  name: z.string(),
  template: z.enum(['frontend', 'backend', 'fullstack', 'desktop']),
  framework: z.enum([
    'react', 'vue', 'angular', 'svelte', 'solid', 'qwik', 'lit',
    'express', 'nest', 'fastify', 'hapi', 'koa',
    'electron', 'tauri'
  ]),
  features: z.array(z.string()),
  database: z.enum(['sqlite', 'none']).optional(),
  ui: z.enum(['2d', '2.5d', '3d']),
  aiAssistance: z.boolean(),
  offlineSupport: z.boolean()
});

export class AppGeneratorService {
  private projectManager: ProjectManager;
  private validationManager: ValidationManager;
  private aiService: AIService;

  constructor() {
    this.projectManager = new ProjectManager();
    this.validationManager = ValidationManager.getInstance();
    this.aiService = new AIService();
  }

  async generateApp(config: z.infer<typeof AppConfigSchema>): Promise<{
    success: boolean;
    error?: string;
    buildPath?: string;
  }> {
    try {
      // 1. Validate configuration
      const validatedConfig = AppConfigSchema.parse(config);

      // 2. Check system requirements
      const validation = await this.validationManager.validateEverything();
      if (!validation.valid) {
        throw new Error(`System validation failed: ${validation.errors.join(', ')}`);
      }

      // 3. Generate project structure
      const project = await this.projectManager.createProject({
        name: validatedConfig.name,
        type: validatedConfig.template,
        framework: validatedConfig.framework,
        dependencies: this.getDependencies(validatedConfig)
      });

      // 4. Generate code using AI
      if (validatedConfig.aiAssistance) {
        await this.generateCodeWithAI(validatedConfig);
      }

      // 5. Build the application
      const buildResult = await this.buildApp(validatedConfig);

      // 6. Final validation
      const finalValidation = await this.validationManager.validateEverything();
      if (!finalValidation.valid) {
        throw new Error(`Final validation failed: ${finalValidation.errors.join(', ')}`);
      }

      return {
        success: true,
        buildPath: buildResult.path
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getDependencies(config: z.infer<typeof AppConfigSchema>): string[] {
    const deps: string[] = [];

    // Frontend Framework Dependencies
    if (config.template === 'frontend' || config.template === 'fullstack') {
      switch (config.framework) {
        case 'react':
          deps.push('react', 'react-dom', '@vitejs/plugin-react');
          break;
        case 'vue':
          deps.push('vue', '@vitejs/plugin-vue', '@vue/compiler-sfc');
          break;
        case 'angular':
          deps.push('@angular/core', '@angular/platform-browser-dynamic', '@angular/cli');
          break;
        case 'svelte':
          deps.push('svelte', '@sveltejs/kit', '@sveltejs/adapter-auto');
          break;
        case 'solid':
          deps.push('solid-js', 'vite-plugin-solid');
          break;
        case 'qwik':
          deps.push('@builder.io/qwik', '@builder.io/qwik-city');
          break;
        case 'lit':
          deps.push('lit', '@lit/reactive-element', '@lit/task');
          break;
      }
    }

    // Backend Framework Dependencies
    if (config.template === 'backend' || config.template === 'fullstack') {
      switch (config.framework) {
        case 'express':
          deps.push('express', '@types/express');
          break;
        case 'nest':
          deps.push('@nestjs/core', '@nestjs/common', '@nestjs/platform-express');
          break;
        case 'fastify':
          deps.push('fastify', '@fastify/cors', '@fastify/swagger');
          break;
        case 'hapi':
          deps.push('@hapi/hapi', '@hapi/joi');
          break;
        case 'koa':
          deps.push('koa', '@koa/router', 'koa-body');
          break;
      }
    }

    // Desktop Framework Dependencies
    if (config.template === 'desktop') {
      switch (config.framework) {
        case 'electron':
          deps.push('electron', 'electron-builder');
          break;
        case 'tauri':
          deps.push('@tauri-apps/api', '@tauri-apps/cli');
          break;
      }
    }

    // UI dependencies
    if (config.ui === '3d' || config.ui === '2.5d') {
      deps.push('three', '@react-three/fiber', '@react-three/drei');
    }

    // Database
    if (config.database === 'sqlite') {
      deps.push('better-sqlite3', '@prisma/client', 'prisma');
    }

    // Development dependencies
    deps.push('vite', 'typescript');

    return deps;
  }

  private async generateCodeWithAI(config: z.infer<typeof AppConfigSchema>): Promise<void> {
    const systemPrompt = `Generate production-ready ${config.framework} code for a ${config.template} application with ${config.ui} UI.`;
    
    // Generate main application code
    await this.aiService.generateCode(
      `Create the main application structure for ${config.framework}`,
      'GPT-3.5-Turbo',
      systemPrompt
    );

    // Generate UI components if needed
    if (config.ui === '3d' || config.ui === '2.5d') {
      await this.aiService.generateCode(
        `Create 3D/2.5D UI components for ${config.framework}`,
        'GPT-3.5-Turbo',
        systemPrompt
      );
    }
  }

  private async buildApp(config: z.infer<typeof AppConfigSchema>): Promise<{ path: string }> {
    switch (config.template) {
      case 'desktop':
        return this.buildDesktopApp(config);
      case 'frontend':
      case 'fullstack':
        return this.buildWebApp(config);
      case 'backend':
        return this.buildBackendApp(config);
      default:
        throw new Error(`Unsupported template: ${config.template}`);
    }
  }

  private async buildDesktopApp(config: z.infer<typeof AppConfigSchema>): Promise<{ path: string }> {
    switch (config.framework) {
      case 'electron':
        return { path: 'release/win-unpacked' };
      case 'tauri':
        return { path: 'src-tauri/target/release' };
      default:
        throw new Error(`Unsupported desktop framework: ${config.framework}`);
    }
  }

  private async buildWebApp(config: z.infer<typeof AppConfigSchema>): Promise<{ path: string }> {
    switch (config.framework) {
      case 'angular':
        return { path: 'dist/angular-app' };
      case 'svelte':
        return { path: 'build' };
      default:
        return { path: 'dist' };
    }
  }

  private async buildBackendApp(config: z.infer<typeof AppConfigSchema>): Promise<{ path: string }> {
    return { path: 'dist' };
  }
}</content>