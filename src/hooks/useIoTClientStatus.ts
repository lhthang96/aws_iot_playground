import { useEffect, useState } from 'react';
import { IoTClient } from 'src/services/IoTClient';
import { IoTClientStatus } from 'src/services/IoTClient.interfaces';

export const useIoTClientStatus = (): IoTClientStatus => {
  const [status, setStatus] = useState<IoTClientStatus>(IoTClient.instance.status);

  useEffect(() => {
    const subscription = IoTClient.instance.status$.subscribe({
      next: (status) => {
        setStatus(status);
      },
    });

    return (): void => subscription.unsubscribe();
  }, []);

  return status;
};
