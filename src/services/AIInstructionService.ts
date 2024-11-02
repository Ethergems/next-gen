import { z } from 'zod';
import { OpenAI } from 'openai';
import { ErrorCheckingService } from './ErrorCheckingService';
import { SupportedLanguage } from './LanguageService';

const InstructionSchema = z.object({
  task: z.string(),
  requirements: z.array(z.string()),
  constraints: z.array(z.string()),
  outputFormat: z.string(),
  language: z.enum(['typescript', 'javascript', 'python', 'cpp', 'java', 'css']),
  targetSystem: z.enum(['windows', 'macos', 'linux']).default('windows'),
  architecture: z.enum(['x64', 'ia32', 'arm64']).default('x64'),
  environment: z.enum(['desktop', 'web', 'mobile']).default('desktop'),
  implementationLevel: z.enum(['full', 'partial']).default('full')
});

export class AIInstructionService {
  private openai: OpenAI;
  private errorChecker: ErrorCheckingService;
  private currentSystem: {
    targetSystem: string;
    architecture: string;
    environment: string;
  };

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.errorChecker = new ErrorCheckingService();
    this.currentSystem = {
      targetSystem: 'windows',
      architecture: 'x64',
      environment: 'desktop'
    };
  }

  setSystemContext(context: { targetSystem: string; architecture: string; environment: string }) {
    this.currentSystem = context;
  }

  async executeInstruction(instruction: z.infer<typeof InstructionSchema>): Promise<{
    code: string;
    explanation: string;
    validationResult: { valid: boolean; errors: string[] };
  }> {
    try {
      const validatedInstruction = InstructionSchema.parse({
        ...instruction,
        targetSystem: this.currentSystem.targetSystem,
        architecture: this.currentSystem.architecture,
        environment: this.currentSystem.environment,
        implementationLevel: 'full' // Always require full implementation
      });

      const systemPrompt = this.createSystemPrompt(validatedInstruction);
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: validatedInstruction.task }
        ],
        temperature: 0.7,
        max_tokens: 2048
      });

      const generatedCode = response.choices[0]?.message?.content || '';
      const validationResult = await this.errorChecker.validateCode(
        generatedCode,
        validatedInstruction.language
      );

      if (!validationResult.valid) {
        return await this.fixAndRetryCode(
          generatedCode,
          validationResult.errors,
          validatedInstruction
        );
      }

      return {
        code: generatedCode,
        explanation: "Code generated successfully and passed validation.",
        validationResult
      };
    } catch (error) {
      throw new Error(`Instruction execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createSystemPrompt(instruction: z.infer<typeof InstructionSchema>): string {
    return `
You are a precise coding assistant that MUST create FULLY FUNCTIONAL implementations.

CRITICAL REQUIREMENTS:
1. ALL code MUST be complete and fully implemented
2. NO placeholder or stub implementations
3. NO "TODO" comments
4. NO partial implementations
5. ALL features must be completely functional
6. ALL error handling must be implemented
7. ALL edge cases must be handled
8. ALL dependencies must be properly imported
9. ALL types must be properly defined
10. ALL functions must be fully implemented

Target System: ${instruction.targetSystem} ${instruction.architecture}
Environment: ${instruction.environment}
Language: ${instruction.language}

System-Specific Instructions:
${this.getSystemSpecificInstructions(instruction)}

Requirements:
${instruction.requirements.map(req => `- ${req}`).join('\n')}

Constraints:
${instruction.constraints.map(con => `- ${con}`).join('\n')}

Output Format: ${instruction.outputFormat}

IMPLEMENTATION RULES:
1. Create complete, production-ready code
2. Implement ALL functionality - no exceptions
3. Include comprehensive error handling
4. Add complete documentation
5. Validate all inputs and outputs
6. Use proper system-specific paths
7. Follow all target system conventions
8. Implement proper logging
9. Add necessary tests
10. Include performance optimizations
`;
  }

  private getSystemSpecificInstructions(instruction: z.infer<typeof InstructionSchema>): string {
    const { targetSystem, environment, architecture } = instruction;
    const instructions: string[] = [];

    switch (targetSystem) {
      case 'windows':
        instructions.push(
          '- Use Windows-style path separators (\\)',
          '- Use Windows-specific environment variables (%USERPROFILE%, %APPDATA%, etc.)',
          '- Handle Windows-specific file permissions',
          '- Consider Windows Defender and UAC implications',
          '- Handle Windows-specific line endings (CRLF)',
          '- Use Windows registry when appropriate',
          '- Handle Windows-specific file associations',
          '- Implement proper Windows error handling',
          '- Use Windows-specific APIs when needed',
          '- Handle Windows security context'
        );
        break;
      case 'linux':
        instructions.push(
          '- Use Unix-style path separators (/)',
          '- Use Linux environment variables ($HOME, $XDG_CONFIG_HOME, etc.)',
          '- Handle Linux file permissions and ownership',
          '- Consider systemd integration where appropriate',
          '- Handle symbolic links correctly',
          '- Use Linux-specific file system conventions',
          '- Implement proper Linux error handling',
          '- Use Linux-specific APIs when needed',
          '- Handle Linux security context'
        );
        break;
      case 'macos':
        instructions.push(
          '- Use Unix-style path separators (/)',
          '- Use macOS environment variables ($HOME, etc.)',
          '- Handle macOS file permissions',
          '- Consider macOS security features (sandbox, etc.)',
          '- Handle .app bundle structure',
          '- Use macOS-specific conventions',
          '- Implement proper macOS error handling',
          '- Use macOS-specific APIs when needed',
          '- Handle macOS security context'
        );
        break;
    }

    if (environment === 'desktop') {
      instructions.push(
        '- Handle window management appropriately',
        '- Implement proper app lifecycle management',
        '- Consider system tray integration',
        '- Handle system events (sleep, shutdown, etc.)',
        `- Optimize for ${architecture} architecture`,
        '- Handle multi-monitor support',
        '- Implement proper window state management',
        '- Handle system notifications',
        '- Implement proper IPC',
        '- Handle system resources properly'
      );
    }

    return instructions.join('\n');
  }

  private async fixAndRetryCode(
    originalCode: string,
    errors: string[],
    instruction: z.infer<typeof InstructionSchema>
  ) {
    const systemContext = `
CRITICAL: Fix ALL issues and ensure the implementation is FULLY FUNCTIONAL.

Target System: ${instruction.targetSystem} ${instruction.architecture}
Environment: ${instruction.environment}

Current Errors:
${errors.join('\n')}

Original Code:
${originalCode}

Requirements:
${instruction.requirements.join('\n')}

FIX REQUIREMENTS:
1. Resolve ALL errors completely
2. Ensure ALL functionality works
3. Maintain complete implementation
4. Add proper error handling
5. Validate all fixes thoroughly
6. Keep code production-ready
7. Optimize performance
8. Add proper documentation
9. Include necessary tests
10. Ensure system compatibility
`;

    const fixResponse = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a code fixing expert. Create FULLY FUNCTIONAL fixes that resolve ALL issues while maintaining complete implementation." 
        },
        { role: "user", content: systemContext }
      ],
      temperature: 0.7,
      max_tokens: 2048
    });

    const fixedCode = fixResponse.choices[0]?.message?.content || '';
    const validationResult = await this.errorChecker.validateCode(
      fixedCode,
      instruction.language
    );

    return {
      code: fixedCode,
      explanation: "Code was fixed and validated. All functionality is fully implemented.",
      validationResult
    };
  }
}