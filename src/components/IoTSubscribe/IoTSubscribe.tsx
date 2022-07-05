import React, { ComponentPropsWithoutRef, useEffect, useRef, useState } from 'react';
import { Subscription } from 'rxjs';
import { IoTClient } from 'src/services/IoTClient';
import { getTimestamp } from 'src/utils';
import { StyledIoTSubscribe } from './IoTSubscribe.styles';

type IoTSubscribeProps = ComponentPropsWithoutRef<'div'>;

export const IoTSubscribe: React.FC<IoTSubscribeProps> = (props) => {
  const [topic, setTopic] = useState<string>('');
  const refLogContainer = useRef<HTMLDivElement>(null);
  const refLogClearBtn = useRef<HTMLButtonElement>(null);
  const refQuantityMessages = useRef(0);
  const refSubscriptions = useRef<Subscription[]>([]);

  const subscribeToTopic = (topic: string): void => {
    const subscription = IoTClient.instance.subscribe(topic).subscribe({
      next: (message) => {
        if (!refLogContainer.current) return;
        const log = JSON.stringify(message.payload?.message, undefined, 2);
        const timestamp = getTimestamp();
        const logElement = document.createElement('pre');
        logElement.innerText = `[${timestamp}]: ${log}`;
        refLogContainer.current.appendChild(logElement);
        refLogContainer.current.scrollTop = refLogContainer.current.scrollHeight;

        // Update number of receive messages
        if (!refLogClearBtn.current) return;
        refQuantityMessages.current += 1;
        const btnText = `Clear ${refQuantityMessages.current} messages`;
        refLogClearBtn.current.innerText = btnText;
      },
    });

    setTopic('');
    refSubscriptions.current.push(subscription);
  };

  useEffect(() => {
    return (): void => {
      refSubscriptions.current.forEach((subscription) => {
        subscription.unsubscribe();
      });
      refSubscriptions.current = [];
    };
  }, []);

  return (
    <StyledIoTSubscribe {...props}>
      <div className="subscribe-input">
        <input
          className="subscribe-input-field"
          value={topic}
          onChange={(event): void => setTopic(event.target.value)}
        />
        <button className="subscribe-input-btn" onClick={(): void => subscribeToTopic(topic)}>
          Subscribe
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
    </StyledIoTSubscribe>
  );
};
