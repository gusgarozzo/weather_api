/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WeatherService } from '../service/weather.service';
import { RedisService } from '../../redis/redis.service';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import {
  IWeatherResponse,
  IDay,
  ISAZM,
} from '../interfaces/weather-response.interface';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_API_KEY = 'mock-api-key';
const MOCK_BASE_URL = 'http://api-clima.com';
const MOCK_CITY = 'tandil';
const MOCK_TTL = 3600;

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockHttpService = {
  get: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'WEATHER_API_KEY') return MOCK_API_KEY;
    if (key === 'WEATHER_API_URL') return MOCK_BASE_URL;
    if (key === 'REDIS_CACHE_TTL') return MOCK_TTL;
    return null;
  }),
};

// Datos mock que cumplen tu interfaz IWeatherResponse
const mockWeatherApiData: IWeatherResponse = {
  queryCost: 1,
  latitude: -37.32,
  longitude: -59.13,
  resolvedAddress: 'Tandil, Buenos Aires, Argentina',
  address: 'tandil',
  timezone: 'America/Argentina/Buenos_Aires',
  tzoffset: -3.0,
  description: 'Día soleado con vientos moderados.',
  days: [] as IDay[],
  alerts: [],
  stations: {
    SAZM: {
      distance: 0,
      latitude: -37.237,
      longitude: -59.227,
      useCount: 0,
      id: 'SAZM',
      name: 'Tandil Airport',
      quality: 100,
      contribution: 0,
    } as ISAZM,
  },
  currentConditions: {
    datetime: '2025-10-15T12:00:00Z',
    datetimeEpoch: 1739592000,
    temp: 22,
    feelslike: 22,
    humidity: 60,
    dew: 14,
    precip: 0,
    precipprob: 0,
    snow: 0,
    snowdepth: null,
    preciptype: null,
    windgust: null,
    windspeed: 12,
    winddir: 180,
    pressure: 1015,
    visibility: 10,
    cloudcover: 15,
    solarradiation: 500,
    solarenergy: 5,
    uvindex: 6,
    conditions: 'Clear',
    icon: 'clear-day',
    stations: ['SAZM'],
    source: 'obs',
    sunrise: '06:00',
    sunriseEpoch: 1739563200,
    sunset: '19:30',
    sunsetEpoch: 1739608800,
    moonphase: 0.5,
  },
};

describe('WeatherService', () => {
  let service: WeatherService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: HttpService, useValue: mockHttpService }, // para inyección aunque no lo uses
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería devolver datos de la caché si existen', async () => {
    // Redis devuelve la cadena JSON (cache hit)
    mockRedisService.get.mockResolvedValueOnce(
      JSON.stringify(mockWeatherApiData),
    );
    // axios no debería llamarse
    mockedAxios.get.mockRejectedValue(new Error('No se debería llamar'));

    const result = await service.getWeather(MOCK_CITY);

    expect(mockRedisService.get).toHaveBeenCalledWith(
      `weather:${encodeURIComponent(MOCK_CITY)}`,
    );
    expect(mockedAxios.get).not.toHaveBeenCalled();
    expect(result).toEqual(mockWeatherApiData);
  });

  it('debería llamar a la API y guardar los datos si la caché está vacía', async () => {
    // cache miss
    mockRedisService.get.mockResolvedValueOnce(null);

    // axios devuelve la respuesta simulada
    mockedAxios.get.mockResolvedValueOnce({ data: mockWeatherApiData });

    // set de Redis resuelto
    mockRedisService.set.mockResolvedValueOnce(null);

    const result = await service.getWeather(MOCK_CITY);

    expect(mockRedisService.get).toHaveBeenCalledWith(
      `weather:${encodeURIComponent(MOCK_CITY)}`,
    );
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(mockRedisService.set).toHaveBeenCalledWith(
      `weather:${encodeURIComponent(MOCK_CITY)}`,
      JSON.stringify(mockWeatherApiData),
      MOCK_TTL,
    );
    expect(result).toEqual(mockWeatherApiData);
  });

  it('debería lanzar un error si la llamada a la API falla', async () => {
    mockRedisService.get.mockResolvedValueOnce(null);
    mockedAxios.get.mockRejectedValueOnce(new Error('API Fallida'));

    await expect(service.getWeather(MOCK_CITY)).rejects.toThrow(
      'Weather API request failed: API Fallida',
    );
  });

  it('debería lanzar un error si Redis falla al obtener o guardar', async () => {
    mockRedisService.get.mockRejectedValueOnce(new Error('Redis Fallida'));

    await expect(service.getWeather(MOCK_CITY)).rejects.toThrow(
      'Weather API request failed: Redis Fallida',
    );

    expect(mockRedisService.set).not.toHaveBeenCalled();
  });
});
