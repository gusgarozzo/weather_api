export type AiRiskLevel = 'low' | 'medium' | 'high';

export interface IAiWeatherResponse {
  summary: string;
  recommendations: string[];
  riskLevel: AiRiskLevel;
}
