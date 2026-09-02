// src/ai/service/ai.service.spec.ts

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IWeatherResponse } from '../../weather/interfaces/weather-response.interface';
import { WeatherService } from '../../weather/service/weather.service';
import { AiService } from '../service/ai.service';

const mockGeminiText = jest.fn(() =>
  JSON.stringify({
    summary: 'El pronóstico generado por la IA.',
    recommendations: ['Lleva paraguas.'],
    riskLevel: 'low',
  }),
);
const mockGeminiResponse = { response: { text: mockGeminiText } };
const mockBaseConditions = {
  datetime: '15:00:00',
  datetimeEpoch: 1678896000,
  temp: 20,
  feelslike: 19,
  humidity: 50,
  dew: 10,
  precip: null,
  precipprob: 0,
  snow: 0,
  snowdepth: 0,
  preciptype: null,
  windgust: null,
  windspeed: 15,
  winddir: 270,
  pressure: 1012,
  visibility: 10,
  cloudcover: 10,
  solarradiation: 250,
  solarenergy: 2.5,
  uvindex: 5,
  conditions: 'Clear',
  icon: 'clear-day',
  stations: ['SAZM'],
  source: 'field',
};

const mockSunData = {
  sunrise: '06:30:00',
  sunriseEpoch: 1678859400,
  sunset: '18:30:00',
  sunsetEpoch: 1678902600,
  moonphase: 0.5,
};

const mockCurrentConditions = {
  ...mockBaseConditions,
  ...mockSunData,
};

const mockDay = {
  ...mockBaseConditions,
  ...mockSunData,
  tempmax: 25,
  tempmin: 15,
  feelslikemax: 24,
  feelslikemin: 14,
  precipcover: 0,
  severerisk: 10,
  description: 'Day description',
  hours: [],
};

const mockWeatherService = {
  getWeather: jest.fn().mockResolvedValue({
    queryCost: 1,
    latitude: -37.32,
    longitude: -59.13,
    resolvedAddress: 'Tandil, Buenos Aires, Argentina',
    address: 'tandil',
    timezone: 'America/Argentina/Buenos_Aires',
    tzoffset: -3.0,
    description: 'Main weather description for the day.',

    // Propiedades Anidadas
    days: [mockDay],
    alerts: [],
    stations: {
      SAZM: {
        distance: 1000,
        latitude: -37.32,
        longitude: -59.13,
        useCount: 1,
        id: 'SAZM',
        name: 'Tandil Airport',
        quality: 100,
        contribution: 0,
      },
    },
    currentConditions: mockCurrentConditions,
  } as IWeatherResponse),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'GEMINI_API_KEY') {
      return 'fake-api-key';
    }
    return null;
  }),
};

jest.mock('@google/generative-ai', () => {
  return {
    SchemaType: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY',
    },
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue(mockGeminiResponse),
        }),
      };
    }),
  };
});

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('debería devolver un pronóstico estructurado', async () => {
    const result = await service.enrichWeather('Tandil');

    expect(result).toEqual({
      summary: 'El pronóstico generado por la IA.',
      recommendations: ['Lleva paraguas.'],
      riskLevel: 'low',
    });
  });

  it('debería devolver un error estructurado si Gemini rompe el contrato', async () => {
    mockGeminiText.mockReturnValueOnce(
      JSON.stringify({ summary: 'Sin recomendaciones' }),
    );

    const result = await service.enrichWeather('Tandil');

    expect(result.riskLevel).toBe('medium');
    expect(result.recommendations).toEqual([]);
  });

  it('debería devolver una cadena de error si la obtención de clima falla', async () => {
    mockWeatherService.getWeather.mockRejectedValue(
      new Error('Fallo simulado'),
    );

    const result = await service.enrichWeather('CiudadErronea');

    expect(result).toEqual({
      summary:
        'Ocurrió un error inesperado al generar el pronóstico. Por favor, inténtalo de nuevo.',
      recommendations: [],
      riskLevel: 'medium',
    });
  });
});
