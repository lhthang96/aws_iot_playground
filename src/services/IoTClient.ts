import { Auth } from '@aws-amplify/auth';
import defaultsDeep from 'lodash.defaultsdeep';
import dropRightWhile from 'lodash.droprightwhile';
import mqtt, {
  ClientSubscribeCallback,
  IClientPublishOptions,
  IClientSubscribeOptions,
  MqttClient,
  PacketCallback,
} from 'mqtt';
import { BehaviorSubject, filter, Observable, Subject } from 'rxjs';
import { AWSUtils } from './AWSUtils';
import { IoTClientLog, IoTClientLogLevel, IoTClientStatus, MQTTMessage } from './IoTClient.interfaces';

const DEFAULT_SUBSCRIBE_OPTIONS: IClientSubscribeOptions = {
  qos: 0,
};
const DEFAULT_PUBLISH_OPTIONS: IClientPublishOptions = {
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
  public log$ = new Subject<IoTClientLog>();

  /**
   * Handle reconnection
   */
  private retryTimes = 0;
  private readonly DEFAULT_RETRY_DURATION = 3 * 1000;

  public init = async (): Promise<void> => {
    this.log('info', 'Initializing IoT Client...');

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
      this.log('success', 'Connected to AWS IoT.');

      if (!this.isFirstConnect) {
        this.log('success', 'Connected after disconnection.');
      }

      this.isFirstConnect = false;
      this.retryTimes = 0;
    });

    this.client.on('error', (error) => {
      this.updateStatus('error');
      this.log('error', `IoT Client error ${error.message}.`);
    });

    this.client.on('reconnect', () => {
      this.retryTimes += 1;
      this.updateStatus('reconnecting');
      this.log('warning', `Retrying to connect to AWS IoT... [Attempt: ${this.retryTimes}]`);
      if (this.client) {
        this.client.options.reconnectPeriod = this.retryTimes * this.DEFAULT_RETRY_DURATION;
      }
    });

    this.client.on('disconnect', (packet) => {
      const { reasonCode } = packet;
      this.log('error', `IoT Client disconnected with code ${reasonCode}.`);
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
    this.client.subscribe(topic, subscribeOptions, (error, granted) => {
      const logMessage = error
        ? `Failed to subscribe to topic ${topic}: ${error.message}.`
        : `Subscribed to topic ${topic}.`;
      this.log('default', logMessage);

      callback?.(error, granted);
    });
    return this.message$.pipe(filter((message) => isMatchTopic(topic, message.topic)));
  };

  public publish = (
    topic: string,
    message: string | Buffer,
    options?: IClientPublishOptions,
    callback?: PacketCallback
  ): void => {
    if (!this.client || this.status !== 'connected') throw new Error('IoT Client has not been initialized yet');
    const publishOptions: IClientPublishOptions = defaultsDeep(options, DEFAULT_PUBLISH_OPTIONS);
    this.client.publish(topic, message, publishOptions, callback);
  };

  private updateStatus = (status: IoTClientStatus): void => {
    this.status = status;
    this.status$.next(status);
  };

  private log = (level: IoTClientLogLevel, message: string): void => {
    this.log$.next({
      timestamp: new Date().getTime(),
      level,
      message,
    });
  };
}

const isMatchTopic = (topic: string, receivedTopic: string): boolean => {
  const elements = topic.split('/');
  const checkingElements = dropRightWhile(elements, (_, index) => elements[index - 1] === '#') as string[];
  const receivedElements = receivedTopic.split('/');
  return checkingElements.every((element, index) => element === '+' || element === receivedElements[index]);
};
