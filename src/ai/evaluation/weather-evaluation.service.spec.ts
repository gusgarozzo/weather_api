import { beforeEach, describe, expect, it } from '@jest/globals';
import { IAiWeatherResponse } from '../interfaces/ai-weather-response.interface';
import { WeatherEvaluationService } from './weather-evaluation.service';
import { weatherEvaluationCases } from './weather-evaluation-cases';

describe('WeatherEvaluationService', () => {
  let service: WeatherEvaluationService;

  beforeEach(() => {
    service = new WeatherEvaluationService();
  });

  it.each(weatherEvaluationCases)(
    'evalúa correctamente el caso $name',
    ({ weather, expected }) => {
      const response: IAiWeatherResponse = {
        summary: `Resumen para ${expected.riskLevel} con recomendaciones relevantes.`,
        recommendations: [
          ...(expected.heatRecommendation
            ? ['Toma agua y usa protector solar.']
            : []),
          ...(expected.coldRecommendation
            ? ['Usa abrigo y mantente abrigado.']
            : []),
          ...(expected.rainRecommendation
            ? ['Lleva paraguas o impermeable.']
            : []),
        ],
        riskLevel: expected.riskLevel,
      };

      const result = service.evaluate(weather, response);
      const normalizedText = response.recommendations
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
      const hasHeat = [
        'calor',
        'caluroso',
        'hidrat',
        'hidrata',
        'agua',
        'protector',
        'solar',
        'sol',
      ].some((keyword) => normalizedText.includes(keyword));
      const hasCold = [
        'abrigo',
        'frio',
        'chaqueta',
        'campera',
        'abrigado',
      ].some((keyword) => normalizedText.includes(keyword));
      const hasRain = [
        'lluvia',
        'lluvioso',
        'paraguas',
        'impermeable',
        'mojado',
        'llov',
      ].some((keyword) => normalizedText.includes(keyword));

      expect(result.passed).toBe(true);
      expect(result.score).toBe(1);
      expect(result.checks).toEqual([
        {
          name: 'heat-recommendation',
          passed: expected.heatRecommendation ? hasHeat : !hasHeat,
        },
        {
          name: 'cold-recommendation',
          passed: expected.coldRecommendation ? hasCold : !hasCold,
        },
        {
          name: 'rain-recommendation',
          passed: expected.rainRecommendation ? hasRain : !hasRain,
        },
        {
          name: 'risk-level',
          passed: true,
        },
      ]);
    },
  );

  it('define medium como una condición con precaución cuando la temperatura real alcanza el umbral de calor', () => {
    const weather = structuredClone(weatherEvaluationCases[3].weather);
    weather.currentConditions.temp = 30;
    weather.currentConditions.feelslike = 32;
    weather.currentConditions.precipprob = 15;
    weather.days[0].tempmax = 30;
    weather.days[0].feelslikemax = 32;

    const result = service.evaluate(weather, {
      summary: 'Hace calor por la temperatura real.',
      recommendations: ['Toma agua y usa protector solar.'],
      riskLevel: 'medium',
    });

    expect(result.passed).toBe(true);
    expect(result.checks).toContainEqual({
      name: 'risk-level',
      passed: true,
    });
  });

  it('rechaza una respuesta que ignora un umbral límite importante', () => {
    const weather = weatherEvaluationCases.find(
      (caseItem) => caseItem.name === 'boundary-temperature-30',
    )?.weather;

    if (!weather) {
      throw new Error('Falta el caso límite de temperatura 30°C.');
    }

    const result = service.evaluate(weather, {
      summary: 'Día agradable.',
      recommendations: [],
      riskLevel: 'low',
    });

    expect(result.passed).toBe(false);
    expect(result.checks).toContainEqual({
      name: 'heat-recommendation',
      passed: false,
    });
  });
});
