import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWeatherResponse } from '../../weather/interfaces/weather-response.interface';
import { WeatherService } from '../../weather/service/weather.service';
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

      return 'Ocurrió un error inesperado al generar el pronóstico. Por favor, inténtalo de nuevo.';
    }
  }

  private formatResponse(aiSummary: string) {
    let formattedSummary = aiSummary;

    const paragraphs = aiSummary
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    formattedSummary = paragraphs.join('<br><br>');
    return formattedSummary;
  }

  private generatePrompt(weatherData: IWeatherResponse): string {
    return `
        Transforma estos datos del clima (formato JSON) en un pronóstico claro y conciso en español. Dirigido a una persona común, debe ser fácil de entender.
        Incluye recomendaciones prácticas basadas en las condiciones:
        * Si hay **lluvia**, sugiere llevar **paraguas**.
        * Si la temperatura es **alta**, aconseja **hidratarse**.
        * Si la temperatura es **baja**, recomienda **abrigarse**.

        No inventes ninguna información.

        Datos del clima:
        ${JSON.stringify(weatherData)}`;
  }

  private async generateAIResponse(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: AiModel.GEMINI_FLASH,
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiSummary = response.text();

    return this.formatResponse(aiSummary);
  }
}
