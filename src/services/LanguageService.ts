import { AIService } from './AIService';

export type SupportedLanguage = 'typescript' | 'javascript' | 'python' | 'cpp' | 'java' | 'css';

export class LanguageService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  getLanguageConfig(language: SupportedLanguage) {
    const configs = {
      typescript: {
        extension: '.ts',
        compiler: 'tsc',
        monaco: 'typescript'
      },
      javascript: {
        extension: '.js',
        compiler: 'node',
        monaco: 'javascript'
      },
      python: {
        extension: '.py',
        compiler: 'python3',
        monaco: 'python'
      },
      cpp: {
        extension: '.cpp',
        compiler: 'g++',
        monaco: 'cpp'
      },
      java: {
        extension: '.java',
        compiler: 'javac',
        monaco: 'java'
      },
      css: {
        extension: '.css',
        compiler: null,
        monaco: 'css'
      }
    };

    return configs[language];
  }

  async generateCode(language: SupportedLanguage, prompt: string, modelName: string): Promise<string> {
    const systemPrompt = `Generate production-ready ${language} code. Include error handling and documentation.`;
    return this.aiService.generateCode(prompt, modelName, systemPrompt);
  }
}