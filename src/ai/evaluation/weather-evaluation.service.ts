import { IAiWeatherResponse } from '../interfaces/ai-weather-response.interface';
import { IWeatherResponse } from '../../weather/interfaces/weather-response.interface';

export type WeatherData = IWeatherResponse;

export interface EvaluationCheck {
  name: string;
  passed: boolean;
}

export interface WeatherEvaluationResult {
  passed: boolean;
  score: number;
  checks: EvaluationCheck[];
}

export class WeatherEvaluationService {
  evaluate(
    weather: WeatherData,
    response: IAiWeatherResponse,
  ): WeatherEvaluationResult {
    const checks = [
      this.checkHeatRecommendation(weather, response),
      this.checkColdRecommendation(weather, response),
      this.checkRainRecommendation(weather, response),
      this.checkRiskLevel(weather, response),
    ];
    const passedChecks = checks.filter((check) => check.passed).length;

    return {
      passed: passedChecks === checks.length,
      score: passedChecks / checks.length,
      checks,
    };
  }

  private checkHeatRecommendation(
    weather: WeatherData,
    response: IAiWeatherResponse,
  ): EvaluationCheck {
    // Política de producto para este ejercicio:
    // la recomendación de calor se activa por temperatura real (temp >= 30).
    // No se considera feelslike, para mantener una regla simple, explícita y testeable.
    const needsHeatRecommendation = weather.currentConditions.temp >= 30;
    const hasHeatRecommendation = this.hasRecommendation(response, [
      'calor',
      'caluroso',
      'hidrat',
      'hidrata',
      'agua',
      'sol',
      'protector',
      'solar',
    ]);

    return {
      name: 'heat-recommendation',
      passed: needsHeatRecommendation
        ? hasHeatRecommendation
        : !hasHeatRecommendation,
    };
  }

  private checkColdRecommendation(
    weather: WeatherData,
    response: IAiWeatherResponse,
  ): EvaluationCheck {
    const needsColdRecommendation =
      weather.currentConditions.temp <= 10 ||
      weather.currentConditions.feelslike <= 10;
    const hasColdRecommendation = this.hasRecommendation(response, [
      'abrigo',
      'frio',
      'chaqueta',
      'campera',
      'abrigado',
    ]);

    return {
      name: 'cold-recommendation',
      passed: needsColdRecommendation
        ? hasColdRecommendation
        : !hasColdRecommendation,
    };
  }

  private checkRainRecommendation(
    weather: WeatherData,
    response: IAiWeatherResponse,
  ): EvaluationCheck {
    const needsRainRecommendation = weather.currentConditions.precipprob >= 60;
    const hasRainRecommendation = this.hasRecommendation(response, [
      'lluvia',
      'lluvioso',
      'paraguas',
      'impermeable',
      'mojado',
      'llov',
    ]);

    return {
      name: 'rain-recommendation',
      passed: needsRainRecommendation
        ? hasRainRecommendation
        : !hasRainRecommendation,
    };
  }

  private checkRiskLevel(
    weather: WeatherData,
    response: IAiWeatherResponse,
  ): EvaluationCheck {
    // Política explícita de riesgo:
    // high > medium > low
    // - high: condiciones severas, peligrosas o extremas
    // - medium: calor/frío/lluvia relevantes con precaución
    // - low: condiciones normales
    const currentConditions = weather.currentConditions;
    const day = weather.days[0];

    const isSevereRisk =
      /storm|tormenta|tornado|hurricane|hurac[aá]n|severe|extreme|alert/i.test(
        `${currentConditions.conditions} ${weather.description}`,
      ) ||
      currentConditions.windspeed >= 70 ||
      (currentConditions.windgust ?? 0) >= 80 ||
      (day?.severerisk ?? 0) >= 70;

    const isMediumRisk =
      currentConditions.temp >= 30 ||
      currentConditions.feelslike >= 30 ||
      currentConditions.temp <= 10 ||
      currentConditions.feelslike <= 10 ||
      currentConditions.precipprob >= 60;

    const expectedRiskLevel: IAiWeatherResponse['riskLevel'] = isSevereRisk
      ? 'high'
      : isMediumRisk
        ? 'medium'
        : 'low';

    return {
      name: 'risk-level',
      passed: response.riskLevel === expectedRiskLevel,
    };
  }

  private hasRecommendation(
    response: IAiWeatherResponse,
    keywords: string[],
  ): boolean {
    const normalizedText = response.recommendations
      .join(' ')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

    return keywords.some((keyword) =>
      normalizedText.includes(
        keyword
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
      ),
    );
  }
}
