import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWeatherResponse } from '../../weather/interfaces/weather-response.interface';
import { WeatherService } from '../../weather/service/weather.service';
import { AiModel } from '../enum/ai-model.enum';
import {
  AiRiskLevel,
  IAiWeatherResponse,
} from '../interfaces/ai-weather-response.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor(
    private readonly weatherService: WeatherService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') as string;
    if (!this.apiKey) {
      throw new Error('La API key de Google Gemini no está configurada.');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async enrichWeather(city: string | undefined): Promise<IAiWeatherResponse> {
    try {
      const weatherData: IWeatherResponse =
        await this.weatherService.getWeather(city);

      const prompt: string = this.generatePrompt(weatherData);

      return await this.generateAIResponse(prompt);
    } catch (error: unknown) {
      this.logger.error(
        `Error at enrichWeather (AiService): ${JSON.stringify(error)}`,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if ((error as any).response) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.error((error as any).response.data);
      }

      if (error instanceof Error) {
        this.logger.error(error.message);
      } else {
        this.logger.error(`Error desconocido: ${JSON.stringify(error)}`);
      }

      return {
        summary:
          'Ocurrió un error inesperado al generar el pronóstico. Por favor, inténtalo de nuevo.',
        recommendations: [],
        riskLevel: 'medium',
      };
    }
  }

  private generatePrompt(weatherData: IWeatherResponse): string {
    return `
        Eres un asistente meteorológico. Analiza los datos y responde únicamente con JSON válido,
        siguiendo exactamente este contrato:
        {
          "summary": "pronóstico claro y conciso en español",
          "recommendations": ["recomendación práctica"],
          "riskLevel": "low | medium | high"
        }
        No inventes información. Incluye paraguas si hay lluvia, hidratación si la temperatura
        es alta y abrigo si es baja. Usa "high" solo ante condiciones potencialmente peligrosas.

        Datos del clima:
        ${JSON.stringify(weatherData)}`;
  }

  private async generateAIResponse(
    prompt: string,
  ): Promise<IAiWeatherResponse> {
    const model = this.genAI.getGenerativeModel({
      model: AiModel.GEMINI_FLASH,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING },
            recommendations: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
            riskLevel: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: ['low', 'medium', 'high'],
            },
          },
          required: ['summary', 'recommendations', 'riskLevel'],
        },
      },
    });

    const result = await model.generateContent(prompt);
    const parsedResponse: unknown = JSON.parse(result.response.text());

    return this.validateResponse(parsedResponse);
  }

  private validateResponse(response: unknown): IAiWeatherResponse {
    if (!response || typeof response !== 'object') {
      throw new Error('La respuesta de IA no tiene un formato válido.');
    }

    const candidate = response as Record<string, unknown>;
    const recommendations = candidate.recommendations;
    const rawRiskLevel = candidate.riskLevel;
    const validRiskLevels: AiRiskLevel[] = ['low', 'medium', 'high'];
    const normalizedRiskLevel =
      rawRiskLevel === 'moderate' ? 'medium' : rawRiskLevel;

    if (
      typeof candidate.summary !== 'string' ||
      !Array.isArray(recommendations) ||
      !recommendations.every((item) => typeof item === 'string') ||
      typeof rawRiskLevel !== 'string' ||
      !validRiskLevels.includes(normalizedRiskLevel as AiRiskLevel)
    ) {
      throw new Error('La respuesta de IA no cumple el contrato esperado.');
    }

    return {
      summary: candidate.summary,
      recommendations,
      riskLevel: normalizedRiskLevel as AiRiskLevel,
    };
  }
}
