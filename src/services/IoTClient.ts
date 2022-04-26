import { Auth } from '@aws-amplify/auth';
import defaultsDeep from 'lodash.defaultsdeep';
import mqtt, { ClientSubscribeCallback, IClientSubscribeOptions, MqttClient } from 'mqtt';
import { Observable } from 'rxjs';
import { AWSUtils } from './AWSUtils';

const DEFAULT_SUBSCRIBE_OPTIONS: IClientSubscribeOptions = {
  qos: 0,
};

export class IoTClient {
  private static instance: IoTClient;

  private constructor() {}

  public static getInstance(): IoTClient {
    if (!IoTClient.instance) {
      IoTClient.instance = new IoTClient();
    }

    return IoTClient.instance;
  }

  /**
   * Configs
   */
  private host = process.env.REACT_APP_IOT_ENDPOINT || '';
  private region = process.env.REACT_APP_REGION || '';

  /**
   * IoT Client states
   */

  private isFirstConnect = true;
  public client: MqttClient | null = null;
  public status: 'initializing' | 'connected' | 'error' | 'reconnecting' = 'initializing';

  public init = async (): Promise<void> => {
    const credentials = await Auth.currentCredentials();
    const signedMQTTUrl = AWSUtils.getInstance().getSignedUrl(this.host, this.region, credentials);
    this.client = mqtt.connect(signedMQTTUrl, {
      transformWsUrl: () => {
        const reconnectSignedMQTTUrl = AWSUtils.getInstance().getSignedUrl(this.host, this.region, credentials);
        return reconnectSignedMQTTUrl;
      },
    });

    this.client.on('connect', () => {
      this.status = 'connected';
      console.log('Connected to AWS IoT.');

      if (!this.isFirstConnect) {
        console.log('Connected after disconnection');
      }

      this.isFirstConnect = false;
    });

    this.client.on('error', (error) => {
      this.status = 'error';
      console.log('Log on error', error);
    });

    this.client.on('reconnect', () => {
      this.status = 'reconnecting';
      console.log('Retrying to connect to AWS IoT...');
    });
  };

  public subscribe = <T = any>(
    topic: string,
    options?: Partial<IClientSubscribeOptions>,
    callback?: ClientSubscribeCallback
  ): Observable<T> => {
    const subscribeOptions: IClientSubscribeOptions = defaultsDeep(options, DEFAULT_SUBSCRIBE_OPTIONS);
    this.client?.subscribe(topic, subscribeOptions, callback);
    return this.getSubscribeObservable<T>(topic);
  };

  private getSubscribeObservable = <T = any>(topic: string): Observable<T> => {
    const observable = new Observable<T>((observer) => {
      this.client?.on('message', (receivedTopic, message) => {
        if (receivedTopic === topic) {
          const parsedPayload = JSON.parse(message.toString()) as T;
          observer.next(parsedPayload);
        }
      });
    });

    return observable;
  };
}
