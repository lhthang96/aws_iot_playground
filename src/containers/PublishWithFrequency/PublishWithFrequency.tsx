import React, { ComponentPropsWithoutRef, useState } from 'react';
import { IoTSubscribe } from 'src/components';
import { IoTClient } from 'src/services/IoTClient';
import { StyledPublishWithFrequency } from './PublishWithFrequency.styles';

type PublishWithFrequencyProps = ComponentPropsWithoutRef<'div'>;

const TEST_TOPIC = 'dt/test';

export const PublishWithFrequency: React.FC<PublishWithFrequencyProps> = (props) => {
  const [quantity, setQuantity] = useState<number>(100);
  const [duration, setDuration] = useState<number>(1);

  const publishMessages = (quantity: number, duration: number): void => {
    const timePerMessage = duration / quantity;
    let i = 1;
    const interval = window.setInterval(() => {
      const payload = { message: `This is payload with index ${i}` };
      IoTClient.instance.publish(TEST_TOPIC, JSON.stringify(payload));
      i++;
      if (i > quantity) {
        window.clearInterval(interval);
      }
    }, timePerMessage);
  };

  return (
    <StyledPublishWithFrequency {...props}>
      <div className="iot-publish">
        <div className="iot-publish-inputs">
          <label htmlFor="quantity-input" style={{ marginRight: 8 }}>
            Quantity
          </label>
          <input
            id="quantity-input"
            type="number"
            value={quantity}
            onChange={(event): void => setQuantity(parseInt(event.target.value) || 0)}
            style={{ marginRight: 16 }}
          />
          <label htmlFor="duration-input" style={{ marginRight: 8 }}>
            Duration
          </label>
          <input
            id="duration-input"
            type="number"
            value={duration}
            onChange={(event): void => setDuration(parseInt(event.target.value) || 0)}
          />
        </div>
        <button onClick={(): void => publishMessages(quantity, duration)} className="iot-publish-btn">
          {`Publish to topic "${TEST_TOPIC}" ${quantity} messages in ${duration} second(s)`}
        </button>
      </div>
      <IoTSubscribe className="iot-subscribe" />
    </StyledPublishWithFrequency>
  );
};
