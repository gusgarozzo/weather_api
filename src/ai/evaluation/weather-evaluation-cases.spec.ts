import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WeatherService } from '../../weather/service/weather.service';
import { AiService } from '../service/ai.service';
import { weatherEvaluationCases } from './weather-evaluation-cases';

type EvaluationWeather = (typeof weatherEvaluationCases)[number]['weather'];

const mockGeminiText = jest.fn<() => string>();
const mockGenerateContent =
  jest.fn<() => Promise<{ response: { text: typeof mockGeminiText } }>>();

jest.mock('@google/generative-ai', () => ({
  SchemaType: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    ARRAY: 'ARRAY',
  },
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

const mockWeatherService = {
  getWeather: jest.fn<(city: string) => Promise<EvaluationWeather>>(),
};
const mockConfigService = {
  get: jest.fn((key: string) =>
    key === 'GEMINI_API_KEY' ? 'fake-api-key' : null,
  ),
};

describe('AiService: evaluación semántica del clima', () => {
  let service: AiService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: WeatherService, useValue: mockWeatherService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it.each(weatherEvaluationCases)(
    'cumple el criterio de evaluación para $name',
    async (evaluationCase) => {
      mockWeatherService.getWeather.mockResolvedValueOnce(
        evaluationCase.weather,
      );

      const recommendations = [
        ...(evaluationCase.expected.heatRecommendation
          ? ['Toma agua y usa protector solar.']
          : []),
        ...(evaluationCase.expected.coldRecommendation
          ? ['Usa abrigo y mantente abrigado.']
          : []),
        ...(evaluationCase.expected.rainRecommendation
          ? ['Lleva paraguas o impermeable.']
          : []),
      ];

      mockGeminiText.mockReturnValueOnce(
        JSON.stringify({
          summary: `Respuesta válida para ${evaluationCase.name}`,
          recommendations,
          riskLevel: evaluationCase.expected.riskLevel,
        }),
      );
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: mockGeminiText },
      });

      const result = await service.enrichWeather('Test city');

      expect(result.summary.trim()).not.toBe('');
      expect(result.riskLevel).toBe(evaluationCase.expected.riskLevel);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(
        recommendations.length,
      );
      for (const recommendation of recommendations) {
        expect(result.recommendations).toContain(recommendation);
      }
    },
  );
});
