import { IWeatherResponse } from '../../weather/interfaces/weather-response.interface';

export type WeatherRiskLevel = 'low' | 'medium' | 'high';

export interface WeatherEvaluationCase {
  name: string;
  weather: IWeatherResponse;
  expected: {
    heatRecommendation: boolean;
    coldRecommendation: boolean;
    rainRecommendation: boolean;
    riskLevel: WeatherRiskLevel;
  };
}

const createWeather = (
  overrides: Partial<IWeatherResponse['currentConditions']> = {},
  dayOverrides: Partial<IWeatherResponse['days'][number]> = {},
): IWeatherResponse => {
  const currentConditions: IWeatherResponse['currentConditions'] = {
    datetime: '2026-08-27T12:00:00Z',
    datetimeEpoch: 1787832000,
    temp: 20,
    feelslike: 20,
    humidity: 50,
    dew: 10,
    precip: 0,
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
    stations: ['TEST'],
    source: 'test',
    sunrise: '06:30:00',
    sunriseEpoch: 1787812200,
    sunset: '18:30:00',
    sunsetEpoch: 1787855400,
    moonphase: 0.5,
    ...overrides,
  };

  const day: IWeatherResponse['days'][number] = {
    ...currentConditions,
    tempmax: currentConditions.temp,
    tempmin: currentConditions.temp,
    feelslikemax: currentConditions.feelslike,
    feelslikemin: currentConditions.feelslike,
    precipcover: 0,
    severerisk: 10,
    description: 'Test weather conditions',
    hours: [],
    ...dayOverrides,
  };

  return {
    queryCost: 1,
    latitude: -37.32,
    longitude: -59.13,
    resolvedAddress: 'Test city',
    address: 'test-city',
    timezone: 'UTC',
    tzoffset: 0,
    description: day.description,
    days: [day],
    alerts: [],
    stations: {
      SAZM: {
        distance: 0,
        latitude: -37.32,
        longitude: -59.13,
        useCount: 1,
        id: 'TEST',
        name: 'Test station',
        quality: 100,
        contribution: 0,
      },
    },
    currentConditions,
  };
};

export const weatherEvaluationCases: WeatherEvaluationCase[] = [
  {
    name: 'hot-day',
    weather: createWeather(
      { temp: 32, feelslike: 34, precipprob: 10 },
      {
        description: 'Día caluroso con sol fuerte',
        severerisk: 15,
      },
    ),
    expected: {
      heatRecommendation: true,
      coldRecommendation: false,
      rainRecommendation: false,
      riskLevel: 'medium',
    },
  },
  {
    name: 'cold-day',
    weather: createWeather(
      { temp: 10, feelslike: 7, precipprob: 5 },
      {
        description: 'Día frío con sensacion térmica baja',
        severerisk: 12,
      },
    ),
    expected: {
      heatRecommendation: false,
      coldRecommendation: true,
      rainRecommendation: false,
      riskLevel: 'medium',
    },
  },
  {
    name: 'rainy-day',
    weather: createWeather(
      { temp: 18, feelslike: 17, precipprob: 80 },
      {
        description: 'Lluvia persistente',
        severerisk: 20,
      },
    ),
    expected: {
      heatRecommendation: false,
      coldRecommendation: false,
      rainRecommendation: true,
      riskLevel: 'medium',
    },
  },
  {
    name: 'normal-day',
    weather: createWeather(
      { temp: 22, feelslike: 22, precipprob: 20 },
      {
        description: 'Día normal y estable',
        severerisk: 10,
      },
    ),
    expected: {
      heatRecommendation: false,
      coldRecommendation: false,
      rainRecommendation: false,
      riskLevel: 'low',
    },
  },
  {
    name: 'hot-and-rainy-day',
    weather: createWeather(
      { temp: 31, feelslike: 33, precipprob: 65 },
      {
        description: 'Calor combinado con lluvia',
        severerisk: 30,
      },
    ),
    expected: {
      heatRecommendation: true,
      coldRecommendation: false,
      rainRecommendation: true,
      riskLevel: 'medium',
    },
  },
  {
    name: 'severe-storm',
    weather: createWeather(
      {
        temp: 28,
        feelslike: 30,
        precipprob: 90,
        conditions: 'Thunderstorm',
        windspeed: 85,
        windgust: 95,
      },
      {
        description: 'Tormenta severa con viento fuerte',
        severerisk: 92,
      },
    ),
    expected: {
      heatRecommendation: false,
      coldRecommendation: false,
      rainRecommendation: true,
      riskLevel: 'high',
    },
  },
  {
    name: 'normal-temperature-extreme-wind',
    weather: createWeather(
      {
        temp: 22,
        feelslike: 22,
        precipprob: 10,
        conditions: 'Clear',
        windspeed: 75,
        windgust: 85,
      },
      {
        description: 'Viento extremo sin calor ni lluvia relevantes',
        severerisk: 80,
      },
    ),
    expected: {
      heatRecommendation: false,
      coldRecommendation: false,
      rainRecommendation: false,
      riskLevel: 'high',
    },
  },
  {
    name: 'boundary-temperature-30',
    weather: createWeather(
      { temp: 30, feelslike: 31, precipprob: 10 },
      {
        description: 'Límite de calor',
        severerisk: 15,
      },
    ),
    expected: {
      heatRecommendation: true,
      coldRecommendation: false,
      rainRecommendation: false,
      riskLevel: 'medium',
    },
  },
  {
    name: 'boundary-temperature-10',
    weather: createWeather(
      { temp: 10, feelslike: 9, precipprob: 25 },
      {
        description: 'Límite de frío',
        severerisk: 12,
      },
    ),
    expected: {
      heatRecommendation: false,
      coldRecommendation: true,
      rainRecommendation: false,
      riskLevel: 'medium',
    },
  },
  {
    name: 'boundary-precipprob-60',
    weather: createWeather(
      { temp: 23, feelslike: 24, precipprob: 60 },
      {
        description: 'Límite de lluvia',
        severerisk: 18,
      },
    ),
    expected: {
      heatRecommendation: false,
      coldRecommendation: false,
      rainRecommendation: true,
      riskLevel: 'medium',
    },
  },
];
