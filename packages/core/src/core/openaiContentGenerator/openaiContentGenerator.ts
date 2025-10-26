import type { ContentGenerator } from '../contentGenerator.js';
import type { Config } from '../../config/config.js';
import { type OpenAICompatibleProvider } from './provider/index.js';
import type {
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentParameters,
  GenerateContentResponse,
} from '@google/genai';
import type { PipelineConfig } from './pipeline.js';
import { ContentGenerationPipeline } from './pipeline.js';
import { DefaultTelemetryService } from './telemetryService.js';
import { EnhancedErrorHandler } from './errorHandler.js';
import { getDefaultTokenizer } from '../../utils/request-tokenizer/index.js';
import type { ContentGeneratorConfig } from '../contentGenerator.js';

export class OpenAIContentGenerator implements ContentGenerator {
  protected pipeline: ContentGenerationPipeline;

  constructor(
    contentGeneratorConfig: ContentGeneratorConfig,
    cliConfig: Config,
    provider: OpenAICompatibleProvider,
  ) {
    // Create pipeline configuration
    const pipelineConfig: PipelineConfig = {
      cliConfig,
      provider,
      contentGeneratorConfig,
      telemetryService: new DefaultTelemetryService(
        cliConfig,
        contentGeneratorConfig.enableOpenAILogging,
      ),
      errorHandler: new EnhancedErrorHandler(
        (error: unknown, request: GenerateContentParameters) =>
          this.shouldSuppressErrorLogging(error, request),
      ),
    };

    this.pipeline = new ContentGenerationPipeline(pipelineConfig);
  }

  /**
   * Hook for subclasses to customize error handling behavior
   * @param error The error that occurred
   * @param request The original request
   * @returns true if error logging should be suppressed, false otherwise
   */
  protected shouldSuppressErrorLogging(
    _error: unknown,
    _request: GenerateContentParameters,
  ): boolean {
    return false; // Default behavior: never suppress error logging
  }

  async generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    return this.pipeline.execute(request, userPromptId);
  }

  async generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    return this.pipeline.executeStream(request, userPromptId);
  }

  async countTokens(
    request: CountTokensParameters,
  ): Promise<CountTokensResponse> {
    try {
      // Use the new high-performance request tokenizer
      const tokenizer = getDefaultTokenizer();
      const result = await tokenizer.calculateTokens(request, {
        textEncoding: 'cl100k_base', // Use GPT-4 encoding for consistency
      });

      return {
        totalTokens: result.totalTokens,
      };
    } catch (error) {
      console.warn(
        'Failed to calculate tokens with new tokenizer, falling back to simple method:',
        error,
      );

      // Fallback to original simple method
      const content = JSON.stringify(request.contents);
      const totalTokens = Math.ceil(content.length / 4); // Rough estimate: 1 token ≈ 4 characters

      return {
        totalTokens,
      };
    }
  }

  async embedContent(
    request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    // Extract text from contents
    let text = '';
    if (Array.isArray(request.contents)) {
      text = request.contents
        .map((content) => {
          if (typeof content === 'string') return content;
          if ('parts' in content && content.parts) {
            return content.parts
              .map((part) =>
                typeof part === 'string'
                  ? part
                  : 'text' in part
                    ? (part as { text?: string }).text || ''
                    : '',
              )
              .join(' ');
          }
          return '';
        })
        .join(' ');
    } else if (request.contents) {
      if (typeof request.contents === 'string') {
        text = request.contents;
      } else if ('parts' in request.contents && request.contents.parts) {
        text = request.contents.parts
          .map((part) =>
            typeof part === 'string' ? part : 'text' in part ? part.text : '',
          )
          .join(' ');
      }
    }

    try {
      const embedding = await this.pipeline.client.embeddings.create({
        model: 'text-embedding-ada-002', // Default embedding model
        input: text,
      });

      return {
        embeddings: [
          {
            values: embedding.data[0].embedding,
          },
        ],
      };
    } catch (error) {
      console.error('OpenAI API Embedding Error:', error);
      throw new Error(
        `OpenAI API error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
