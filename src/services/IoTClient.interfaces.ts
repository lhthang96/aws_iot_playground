import { ClientSubscribeCallback, IClientSubscribeOptions } from 'mqtt';

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

export type SubscribeParams = {
  topic: string;
  options?: MQTTSubscribeOptions;
  callback?: ClientSubscribeCallback;
};

export type MQTTSubscribeOptions = IClientSubscribeOptions & {
  subscribeId?: string;
};
