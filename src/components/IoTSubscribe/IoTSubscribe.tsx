import React, { ComponentPropsWithoutRef, useRef, useState } from 'react';
import { IoTClient } from 'src/services/IoTClient';
import { StyledIoTSubscribe } from './IoTSubscribe.styles';

type IoTSubscribeProps = ComponentPropsWithoutRef<'div'>;

export const IoTSubscribe: React.FC<IoTSubscribeProps> = (props) => {
  const [topic, setTopic] = useState<string>('');
  const refLogContainer = useRef<HTMLDivElement>(null);

  const subscribeToTopic = (topic: string): void => {
    IoTClient.instance.subscribe(topic).subscribe({
      next: (message) => {
        if (!refLogContainer.current) return;
        const log = JSON.stringify(message.payload?.message, undefined, 2);
        const logElement = document.createElement('pre');
        logElement.innerText = log;
        refLogContainer.current?.appendChild(logElement);
        refLogContainer.current.scrollTop = refLogContainer.current.scrollHeight;
      },
    });

    setTopic('');
  };

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
      <div className="subscribe-log" ref={refLogContainer} />
    </StyledIoTSubscribe>
  );
};
