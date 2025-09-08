export interface IWeatherResponse {
  queryCost: number;
  latitude: number;
  longitude: number;
  resolvedAddress: string;
  address: string;
  timezone: string;
  tzoffset: number;
  description: string;
  days: IDay[];
  alerts: [];
  stations: {
    SAZM: {
      distance: number;
      latitude: number;
      longitude: number;
      useCount: number;
      id: string;
      name: string;
      quality: number;
      contribution: number;
    };
  };
  currentConditions: ICurrentConditions;
}


interface IBaseConditions {
  datetime: string;
  datetimeEpoch: number;
  temp: number;
  feelslike: number;
  humidity: number;
  dew: number;
  precip: number | null;
  precipprob: number;
  snow: number;
  snowdepth: number | null;
  preciptype: string[] | null;
  windgust: number | null;
  windspeed: number;
  winddir: number;
  pressure: number;
  visibility: number;
  cloudcover: number;
  solarradiation: number;
  solarenergy: number;
  uvindex: number;
  conditions: string;
  icon: string;
  stations: string[];
  source: string;
}

interface IWithSunData {
  sunrise: string;
  sunriseEpoch: number;
  sunset: string;
  sunsetEpoch: number;
  moonphase: number;
}


export interface ICurrentConditions extends IBaseConditions, IWithSunData {}

export interface IDay extends IBaseConditions, IWithSunData {
  tempmax: number;
  tempmin: number;
  feelslikemax: number;
  feelslikemin: number;
  precipcover: number;
  severerisk: number;
  description: string;
  hours: IHour[];
}

export interface IHour extends IBaseConditions {
  severerisk: number;
}
