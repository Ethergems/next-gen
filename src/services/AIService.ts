import { OpenAI } from 'openai';
import { HfInference } from '@huggingface/inference';
import { Together } from 'together-ai';

export type AIModelConfig = {
  name: string;
  provider: string;
  requiresInternet: boolean;
  enabled: boolean;
  supportedLanguages: string[];
};

export class AIService {
  private openai: OpenAI;
  private hf: HfInference;
  private together: Together;
  private isOnline: boolean = true;

  private models: AIModelConfig[] = [
    { 
      name: 'GPT-3.5-Turbo',
      provider: 'openai',
      requiresInternet: true,
      enabled: true,
      supportedLanguages: ['typescript', 'javascript', 'python', 'cpp', 'java', 'css']
    },
    { 
      name: 'Llama-2-70B',
      provider: 'together',
      requiresInternet: true,
      enabled: true,
      supportedLanguages: ['typescript', 'javascript', 'python', 'cpp', 'java', 'css']
    },
    { 
      name: 'CodeLlama-34B',
      provider: 'huggingface',
      requiresInternet: true,
      enabled: true,
      supportedLanguages: ['typescript', 'javascript', 'python', 'cpp', 'java']
    }
  ];

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.hf = new HfInference(process.env.HUGGING_FACE_API_KEY);
    this.together = new Together({ apiKey: process.env.TOGETHER_API_KEY });
  }

  setOnlineStatus(status: boolean) {
    this.isOnline = status;
  }

  getAvailableModels(): AIModelConfig[] {
    return this.models.filter(model => 
      this.isOnline ? true : !model.requiresInternet
    );
  }

  async generateCode(prompt: string, modelName: string, systemPrompt: string): Promise<string> {
    try {
      const model = this.models.find(m => m.name === modelName);
      if (!model) throw new Error('Model not found');

      if (!this.isOnline && model.requiresInternet) {
        throw new Error('Selected model requires internet connection');
      }

      switch (model.provider) {
        case 'openai':
          return await this.generateWithOpenAI(prompt, systemPrompt);
        case 'together':
          return await this.generateWithTogether(prompt, systemPrompt);
        case 'huggingface':
          return await this.generateWithHuggingFace(prompt);
        default:
          throw new Error('Unsupported model provider');
      }
    } catch (error) {
      throw new Error(`Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateWithOpenAI(prompt: string, systemPrompt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048
    });

    return response.choices[0]?.message?.content || '';
  }

  private async generateWithTogether(prompt: string, systemPrompt: string): Promise<string> {
    const response = await this.together.complete({
      prompt: `${systemPrompt}\n\n${prompt}`,
      model: 'togethercomputer/llama-2-70b-chat',
      max_tokens: 2048,
      temperature: 0.7
    });

    return response.output.text;
  }

  private async generateWithHuggingFace(prompt: string): Promise<string> {
    const response = await this.hf.textGeneration({
      model: 'codellama/CodeLlama-34b-Instruct-hf',
      inputs: prompt,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7
      }
    });

    return response.generated_text;
  }
}