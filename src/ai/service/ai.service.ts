import { Injectable, Logger } from '@nestjs/common';
import { WeatherService } from 'src/weather/service/weather.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

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

  async enrichWeather(city: string | undefined) {
    try {
      const weatherData = this.weatherService.getWeather(city);
      const prompt: string = `
        Recibís datos del clima en formato JSON. 
        Transformalos en un pronóstico claro en español, útil para una persona común.
        Si hay lluvia, recomendá paraguas; si hace calor, recomendá hidratarse; si hace frío, recomendá abrigo.
        No inventes datos. 
        Datos: ${JSON.stringify(weatherData)}`;

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiSummary = response.text();

      return {
        raw: weatherData,
        aiSummary: aiSummary,
      };
    } catch (error) {
      throw error;
    }
  }
}
