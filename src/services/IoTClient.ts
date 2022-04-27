import { Auth } from '@aws-amplify/auth';
import defaultsDeep from 'lodash.defaultsdeep';
import dropRightWhile from 'lodash.droprightwhile';
import mqtt, { ClientSubscribeCallback, IClientSubscribeOptions, MqttClient } from 'mqtt';
import { BehaviorSubject, filter, map, Observable, Subject } from 'rxjs';
import { AWSUtils } from './AWSUtils';
import { IoTClientStatus } from './IoTClient.interfaces';

type MQTTMessage<T = any> = {
  topic: string;
  payload: T;
};

const DEFAULT_SUBSCRIBE_OPTIONS: IClientSubscribeOptions = {
  qos: 0,
};

export class IoTClient {
  private static _instance: IoTClient;

  private constructor() {}

  public static get instance(): IoTClient {
    if (!IoTClient._instance) {
      IoTClient._instance = new IoTClient();
    }

    return IoTClient._instance;
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
  private message$: Observable<MQTTMessage> | null = null;

  public client: MqttClient | null = null;
  public status: IoTClientStatus = 'initializing';
  public status$ = new BehaviorSubject<IoTClientStatus>('initializing');

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
      this.updateStatus('connected');
      console.log('Connected to AWS IoT.');

      if (!this.isFirstConnect) {
        console.log('Connected after disconnection');
      }

      this.isFirstConnect = false;
    });

    this.client.on('error', (error) => {
      this.updateStatus('error');
      console.log('Log on error', error);
    });

    this.client.on('reconnect', () => {
      this.updateStatus('reconnecting');
      console.log('Retrying to connect to AWS IoT...');
    });

    this.message$ = new Observable((observer) => {
      this.client?.on('message', (topic, payload) => {
        observer.next({ topic, payload: JSON.parse(payload.toString()) });
      });
    });
  };

  public subscribe = <T = any>(
    topic: string,
    options?: Partial<IClientSubscribeOptions>,
    callback?: ClientSubscribeCallback
  ): Observable<MQTTMessage<T>> => {
    if (!this.message$ || !this.client) throw new Error('IoT Client has not been initialized yet');

    const subscribeOptions: IClientSubscribeOptions = defaultsDeep(options, DEFAULT_SUBSCRIBE_OPTIONS);
    this.client.subscribe(topic, subscribeOptions, callback);
    return this.message$.pipe(filter((message) => isMatchTopic(topic, message.topic)));
  };

  private updateStatus = (status: IoTClientStatus): void => {
    this.status = status;
    this.status$.next(status);
  };
}

const isMatchTopic = (topic: string, receivedTopic: string): boolean => {
  const elements = topic.split('/');
  const checkingElements = dropRightWhile(elements, (_, index) => elements[index - 1] === '#') as string[];
  const receivedElements = receivedTopic.split('/');
  return checkingElements.every((element, index) => element === '+' || element === receivedElements[index]);
};
