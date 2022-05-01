import React, { ComponentPropsWithoutRef, useEffect, useRef, useState } from 'react';
import { IoTClient } from 'src/services/IoTClient';
import { StyledSubscribeMultipleTopics } from './SubscribeMultipleTopics.styles';
import { Subscription } from 'rxjs';
import { getTimestamp } from 'src/utils';

type SubscribeMultipleTopicsProps = ComponentPropsWithoutRef<'div'>;

const TEST_TOPIC = 'dt/test';

export const SubscribeMultipleTopics: React.FC<SubscribeMultipleTopicsProps> = (props) => {
  const [quantity, setQuantity] = useState(100);
  const [topicIndex, setTopicIndex] = useState(1);
  const [publishAllDuration, setPublishAllDuration] = useState(1);
  const [subscribeDuration, setSubscribeDuration] = useState(0.1);
  const [disabled, setDisabled] = useState(false);
  const refLogContainer = useRef<HTMLDivElement>(null);
  const refLogClearBtn = useRef<HTMLButtonElement>(null);
  const refQuantityMessages = useRef(0);
  const refSubscriptions = useRef<Subscription[]>([]);

  const subscribeTopics = (quantity: number, duration: number): void => {
    setDisabled(true);
    clearSubscriptions();
    let i = 1;
    const timePerSubscription = (duration * 1000) / quantity;
    const interval = window.setInterval(() => {
      const subscription = IoTClient.instance.subscribe({ topic: `${TEST_TOPIC}/${i}` }).subscribe({
        next: ({ topic, payload }) => {
          if (!refLogContainer.current) return;
          const log = JSON.stringify(payload?.message);
          const timestamp = getTimestamp();
          const logElement = document.createElement('pre');
          logElement.innerText = `${timestamp} - [${topic}]: ${log}`;
          refLogContainer.current?.appendChild(logElement);
          refLogContainer.current.scrollTop = refLogContainer.current.scrollHeight;

          // Update number of receive messages
          if (!refLogClearBtn.current) return;
          refQuantityMessages.current += 1;
          const btnText = `Clear ${refQuantityMessages.current} messages`;
          refLogClearBtn.current.innerText = btnText;
        },
      });
      refSubscriptions.current.push(subscription);

      i++;
      if (i > quantity) {
        window.clearInterval(interval);
        setDisabled(false);
      }
    }, timePerSubscription);
  };

  const clearSubscriptions = (): void => {
    refSubscriptions.current.forEach((subscription) => {
      subscription.unsubscribe();
    });
    refSubscriptions.current = [];
  };

  const publishToTopicIndex = (index: number): void => {
    IoTClient.instance.publish(`${TEST_TOPIC}/${index}`, JSON.stringify({ message: 'Here is testing payload' }));
  };

  const publishToAllTopics = (quantity: number, duration: number): void => {
    let i = 1;
    const timePerMessage = (duration * 1000) / quantity;
    const interval = window.setInterval(() => {
      publishToTopicIndex(i);
      i++;
      if (i > quantity) {
        window.clearInterval(interval);
      }
    }, timePerMessage);
  };

  useEffect(() => {
    return (): void => {
      clearSubscriptions();
    };
  }, []);

  return (
    <StyledSubscribeMultipleTopics {...props}>
      <div className="iot-subscribe">
        <label htmlFor="quantity-input" style={{ marginRight: 8 }}>
          Quantity
        </label>
        <input
          id="quantity-input"
          type="number"
          disabled={disabled}
          value={quantity}
          onChange={(event): void => setQuantity(parseInt(event.target.value) || 0)}
          style={{ marginRight: 16, width: 80 }}
        />
        <label htmlFor="subscribe-duration-input" style={{ marginRight: 8 }}>
          Duration
        </label>
        <input
          id="subscribe-duration-input"
          type="number"
          disabled={disabled}
          value={subscribeDuration}
          onChange={(event): void => setSubscribeDuration(parseInt(event.target.value) || 0)}
          style={{ marginRight: 16, width: 80 }}
        />
        <button
          onClick={(): void => subscribeTopics(quantity, subscribeDuration)}
          className="iot-subscribe-btn"
          style={{ marginRight: 16 }}
          disabled={disabled}
        >
          {`Subscribe to ${quantity} topics "${TEST_TOPIC}/{{index}}" in ${subscribeDuration} second(s)`}
        </button>
        <button disabled={disabled} onClick={clearSubscriptions}>
          Clear subscriptions
        </button>
      </div>
      <div className="iot-publish">
        <label htmlFor="topic-index-input" style={{ marginRight: 8 }}>
          Topic index
        </label>
        <input
          id="topic-index-input"
          type="number"
          disabled={disabled}
          value={topicIndex}
          onChange={(event): void => setTopicIndex(parseInt(event.target.value) || 0)}
          style={{ marginRight: 16, width: 80 }}
        />
        <button
          onClick={(): void => publishToTopicIndex(topicIndex)}
          className="iot-subscribe-btn"
          disabled={disabled}
          style={{ marginRight: 16 }}
        >
          {`Publish to topic "${TEST_TOPIC}/${topicIndex}"`}
        </button>
        <label htmlFor="duration-input" style={{ marginRight: 8 }}>
          Duration
        </label>
        <input
          id="duration-input"
          type="number"
          disabled={disabled}
          value={publishAllDuration}
          onChange={(event): void => setPublishAllDuration(parseInt(event.target.value) || 0)}
          style={{ marginRight: 16, width: 80 }}
        />
        <button
          disabled={disabled}
          onClick={(): void => publishToAllTopics(quantity, publishAllDuration)}
          className="iot-subscribe-btn"
        >
          {`Publish to ${quantity} topics in ${publishAllDuration} second(s)`}
        </button>
      </div>
      <div className="iot-logs">
        <div className="iot-logs-display" ref={refLogContainer} />
        <button
          ref={refLogClearBtn}
          onClick={(): void => {
            if (!refLogContainer.current) return;
            refLogContainer.current.innerHTML = '';

            if (!refLogClearBtn.current) return;
            refLogClearBtn.current.innerText = 'Clear';
            refQuantityMessages.current = 0;
          }}
          className="iot-clear-btn"
        >
          Clear
        </button>
      </div>
    </StyledSubscribeMultipleTopics>
  );
};
