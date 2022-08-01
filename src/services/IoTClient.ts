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
import { BehaviorSubject, filter, finalize, Observable, Subject } from 'rxjs';
import { AWSUtils } from './AWSUtils';
import {
  IoTClientLog,
  IoTClientLogLevel,
  IoTClientStatus,
  MQTTMessage,
  MQTTSubscribeOptions,
  SubscribeParams,
} from './IoTClient.interfaces';

const DEFAULT_SUBSCRIBE_OPTIONS: MQTTSubscribeOptions = {
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
  private subscribingRequests: { [id: string]: SubscribeParams } = {};

  public init = async (): Promise<void> => {
    this.log('info', 'Initializing IoT Client...');

    const credentials = await Auth.currentCredentials();
    const signedMQTTUrl = AWSUtils.getInstance().getSignedUrl(this.host, this.region, credentials);
    this.client = mqtt.connect(signedMQTTUrl, {
      transformWsUrl: () => {
        const reconnectSignedMQTTUrl = AWSUtils.getInstance().getSignedUrl(this.host, this.region, credentials);
        return reconnectSignedMQTTUrl;
      },
      /**
       * Ref: https://ap-northeast-1.console.aws.amazon.com/servicequotas/home/services/iotcore/quotas/L-A6574E9E
       * AWS IoT Broker limits subscriptions per request to 8. It means, if you send a subscribe request with 9 or above
       * subscriptions, your client will be disconnected.
       *
       * By default of mqtt.js, `resubscribe` is set to true, it will resubscribe to all subscribing topics after reconnected,
       * but it only sends one subscribe request to the broker. Therefore, if you subscribed to 9 or more topics,
       * when you reconnected after a disconnection, mqtt.js will send a subscribe request which includes all the topics
       * that you subscribed. As a result:
       *  1. Your client will be disconnected
       *  2. Your client reconnected, then send a resubscribe request with 9 or more topics
       *  3. Back to step 1
       *
       * To avoid this unexpected behavior, we can turn off the `resubscribe` option and handle the resubscribe by ourself
       */
      resubscribe: false,
      // Send pingreq for every 10 seconds
      keepalive: 10,

      /**
       * If true, MQTT client won't send the ping if it is publishing messages to broker.
       * If false, the client keeps pinging for every keepalive duration
       */
      reschedulePings: false,
    });

    this.client.on('connect', () => {
      this.updateStatus('connected');
      this.log('success', 'Connected to AWS IoT.');
      this.resubscribeTopics();
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

    this.client.on('packetreceive', (packet) => {
      console.log('Received packet', { packet });
    });

    this.client.on('packetsend', (packet) => {
      console.log('Send packet', { packet });
    });
  };

  public subscribe = <T = any>(
    topic: string,
    options?: MQTTSubscribeOptions,
    callback?: ClientSubscribeCallback
  ): Observable<MQTTMessage<T>> => {
    const { subscribeId = getBaseId() } = options || {};
    if (!isValidTopic(topic)) throw new Error('Invalid topic');

    if (!this.message$ || !this.client) throw new Error('IoT Client has not been initialized yet');

    // Put to queue for resubscribing after disconnected
    if (!this.subscribingRequests[subscribeId]) {
      this.saveSubscribeRequest(topic, options, callback);
    }

    const subscribeOptions: IClientSubscribeOptions = defaultsDeep(options, DEFAULT_SUBSCRIBE_OPTIONS);
    this.client.subscribe(topic, subscribeOptions, (error, granted) => {
      const logLevel = error ? 'error' : 'default';
      const logMessage = error
        ? `Failed to subscribe to topic ${topic}: ${error.message}.`
        : `Subscribed to topic ${topic} [subscribeId: ${subscribeId}].`;
      this.log(logLevel, logMessage);

      callback?.(error, granted);
    });

    return this.message$.pipe(
      filter((message) => isMatchTopic(topic, message.topic)),
      // When subscriber unsubscribe or get an error -> remove this request -> this request won't be resubscribe if
      // the client is reconnected after a disconnection
      finalize(() => {
        this.removeSubscribeRequest(subscribeId);
        this.log('default', `Unsubscribed from topic ${topic} [subscribeId: ${subscribeId}]`);
      })
    );
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

  private saveSubscribeRequest = (
    topic: string,
    options?: MQTTSubscribeOptions,
    callback?: ClientSubscribeCallback
  ): void => {
    const { subscribeId } = options || {};
    if (subscribeId) {
      this.subscribingRequests[subscribeId] = { topic, options, callback };
    }
  };

  private removeSubscribeRequest = (subscribeId: string): void => {
    delete this.subscribingRequests[subscribeId];
  };

  private resubscribeTopics = (): void => {
    Object.values(this.subscribingRequests).forEach((subscribeRequest) => {
      const { topic, options, callback } = subscribeRequest || {};
      this.subscribe(topic, options, callback);
    });
  };
}

const isMatchTopic = (topic: string, receivedTopic: string): boolean => {
  const elements = topic.split('/');
  const checkingElements = dropRightWhile(elements, (_, index) => elements[index - 1] === '#') as string[];
  const receivedElements = receivedTopic.split('/');
  return checkingElements.every((element, index) => element === '+' || element === receivedElements[index]);
};

const isValidTopic = (topic: string): boolean => {
  // Check topic with wildcard #

  // Check limited quantity of "/"

  return true;
};

const getBaseId = (): string => {
  return Math.random().toString();
};
