import { Injectable, Logger } from '@nestjs/common';
import { WeatherService } from 'src/weather/service/weather.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { IWeatherResponse } from 'src/weather/interfaces/weather-response.interface';
import { AiModel } from '../enum/ai-model.enum';

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

  async enrichWeather(city: string | undefined): Promise<string | undefined> {
    try {
      const weatherData: IWeatherResponse =
        await this.weatherService.getWeather(city);

      const prompt: string = this.generatePrompt(weatherData);

      return this.generateAIResponse(prompt);
    } catch (error) {
      this.logger.error(
        `Error at enrichWeather (AiService): ${JSON.stringify(error)}`,
      );

      if (error.message.includes('429')) {
        return 'El servicio de IA está sobrecargado. Inténtalo de nuevo más tarde.';
      }
      if (error.message.includes('503')) {
        return 'El servicio de IA no está disponible en este momento. Por favor, inténtalo más tarde.';
      }
      if (error.message.includes('404')) {
        return 'No se pudo contactar al modelo de IA. Verifica la configuración de tu API.';
      }

      return 'Ocurrió un error inesperado al generar el pronóstico. Por favor, inténtalo de nuevo.';
    }
  }

  private formatResponse(aiSummary: string) {
    try {
      let formattedSummary = aiSummary;
      const recomendations: string[] = [];

      const paragraphs = aiSummary
        .split('\n\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      formattedSummary = paragraphs.join('<br><br>');
      return formattedSummary;
    } catch (error) {
      throw error;
    }
  }

  private generatePrompt(weatherData: IWeatherResponse): string {
    try {
      return `
        Transforma estos datos del clima (formato JSON) en un pronóstico claro y conciso en español. Dirigido a una persona común, debe ser fácil de entender.
        Incluye recomendaciones prácticas basadas en las condiciones:
        * Si hay **lluvia**, sugiere llevar **paraguas**.
        * Si la temperatura es **alta**, aconseja **hidratarse**.
        * Si la temperatura es **baja**, recomienda **abrigarse**.

        No inventes ninguna información.

        Datos del clima:
        ${JSON.stringify(weatherData)}`;
    } catch (error) {
      throw error;
    }
  }

  private async generateAIResponse(prompt: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: AiModel.GEMINI_FLASH,
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiSummary = response.text();

      return this.formatResponse(aiSummary);
    } catch (error) {
      throw error;
    }
  }
}
