import { ClientSubscribeCallback, IClientSubscribeOptions } from 'mqtt';
import { Observable } from 'rxjs';

export type IoTClientStatus = 'initializing' | 'connected' | 'error' | 'reconnecting';
export type IoTClientLogLevel = 'info' | 'success' | 'warning' | 'error' | 'default';

export type MQTTMessage<T = any> = {
  topic: string;
  payload: T;
};

export type IoTClientLog = {
  timestamp: number;
  level: IoTClientLogLevel;
  message: string;
};

export type SubscribeRequestParams = {
  topic: string;
  options?: Partial<IClientSubscribeOptions>;
  callback?: ClientSubscribeCallback;
};
