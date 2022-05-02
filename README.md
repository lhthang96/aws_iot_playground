# AWS IoT Playground

A testing place with AWS IoT Core by connecting to AWS IoT Broker via `mqtt.js` instead of using @aws-amplify/pubsub

# Testing scenarios

## AWS IAM Policy

Policy is configured for IoT service:

```JSON
{
  "Sid": "VisualEditor1",
  "Effect": "Allow",
  "Action": [
    "iot:Receive",
    "iot:Subscribe",
    "iot:Connect",
    "iot:Publish"
  ],
  "Resource": [
    "arn:aws:iot:aws_region:aws_account_id:client/*",
    "arn:aws:iot:aws_region:aws_account_id:topicfilter/dt/test/*",
    "arn:aws:iot:aws_region:aws_account_id:topic/dt/test/*"
  ]
}
```

When we try subscribing to a not-allowed topic:

1. MQTT Client sends a subscribe to `a_not_allowed_topic` to AWS IoT Broker.
2. AWS IoT Broker closes the connection.
3. MQTT Client try reconnecting.
4. The connection is established, MQTT Client try to resubscribe the not allowed topic.
5. Back to step 2.

We will get the same result if we try publishing to a not allowed topic.

## Test reconnection

> The keep alive interval time is 10 seconds

### Case 1: Suddenly turn off and turn on internet connection in a short period

Turn off the internet connection in around 5 seconds:

1. No reconnect attempt.
2. Try subscribing to topic `dt/test/1`, received the log that subscribed to topic immediately.
3. Try publishing a message to topic `dt/test/1`, experience a delay of 2 seconds before received the message.
4. Try publishing another message to topic `dt/test/1`, experience a delay of 2 seconds before received the message.
5. Try publishing another message to topic `dt/test/1`, received the message immediately.
6. MQTT connection seems to work normally.

### Case 2: Turn off internet connection, wait for the first `pingreq` without a response, turn on the internet connection

Turn off the internet connection in around 15 seconds:

1. MQTT Client sends a `pingreq` but no response from AWS IoT Broker.
2. Turn on the internet connection.
3. Reconnecting, MQTT Client sends a `connect`, and received the `connack` from the broker. The connection is established.
4. Try subscribing to topic `dt/test/1`, received the log that subscribed to topic immediately.
5. Try publishing a message to topic `dt/test/1`, experience a delay of 2 seconds before received the message. The same delay is applied for the next 5 messages.
6. Try publishing another message to topic `dt/test/1`, received the message immediately.
7. MQTT connection seems to work normally.

### Case 3: Turn off internet connection, wait for MQTT Client send a reconnect request twice, turn on the internet connection

Turn off the internet connection in around 25 seconds:

1. MQTT Client sends a `pingreq` but no response from AWS IoT Broker.
2. Reconnecting, MQTT Client sends a `connect` but no response from the broker.
3. Reconnecting, MQTT Client sends a `connect` but no response from the broker.
4. Turn on the internet connection.
5. Reconnecting, MQTT Client sends a `connect`, and received the `connack` from the broker. The connection is established.
6. Try subscribing to topic `dt/test/1`, received the log that subscribed to topic immediately.
7. Try publishing another message to topic `dt/test/1`, received the message immediately.
8. MQTT connection seems to work normally.

## Testing with AWS IoT limits and quotas

### Publish requests per second per connection

> Implementation: `PublishWithFrequency.tsx`

Ref: https://ap-southeast-1.console.aws.amazon.com/servicequotas/home/services/iotcore/quotas/L-083F3861

AWS IoT Core restricts each client connection to a maximum number of inbound and outbound publish requests per second. This limit includes messages sent to offline persistent session. Publish requests that exceed that quota are discarded.

#### Case 1: Publish 100 messages in 1 second

Result: Received 100% messages ✅

- 1st attempt: Received 100 messages
- 2nd attempt: Received 100 messages
- 3rd attempt: Received 100 messages

It's safe to say that we can receive all the messages, but still, received messages might not be in the correct order.

#### Case 2: Publish 1000 messages in 1 second

Result: Received 70% messages ❗

- 1st attempt: Received 700 messages
- 2nd attempt: Received 704 messages
- 3rd attempt: Received 699 messages

#### Case 3: Publish 700 messages in 1 second

Result: Received 81% messages ❗

- 1st attempt: Received 578 messages
- 2nd attempt: Received 540 messages
- 3rd attempt: Received 585 messages

#### Case 4: Publish 500 messages in 1 second

Result: Received 100% messages ✅

- 1st attempt: Received 500 messages
- 2nd attempt: Received 500 messages
- 3rd attempt: Received 500 messages

#### Case 5: Publish 600 messages in 1 second

Result: Received 88% messages ❗

- 1st attempt: Received 546 messages
- 2nd attempt: Received 518 messages
- 3rd attempt: Received 532 messages

### Subscriptions per connection

Ref: https://ap-southeast-1.console.aws.amazon.com/servicequotas/home/services/iotcore/quotas/L-45957C13

AWS IoT Core supports 50 subscriptions per connection. AWS IoT Core might reject subscription requests on the same connection in excess of this amount and the connection is closed. Clients should validate the SUBACK message to ensure that their subscription requests have been successfully processed.

> Implementation: `SubscribeMultipleTopics.tsx`

#### Case 1: Subscribe to 50 topics

Result:

- 1st attempt: Successfully subscribe to 50 topics
- 2nd attempt: Successfully subscribe to 50 topics
- 3rd attempt: Successfully subscribe to 50 topics

#### Case 2: Subscribe to 100 topics

Result:

- 1st attempt:

  - MQTT Client logged that we successfully subscribe to 100 topics (dt/test/1 -> dt/test/100)
  - But only received messages from the first 50 topics (dt/test/1 -> dt/test/50) ✅

- 2nd attempt:

  - MQTT Client logged that we successfully subscribe to 100 topics (dt/test/1 -> dt/test/100)
  - But only received messages from the first 50 topics (dt/test/1 -> dt/test/50) ✅

- 3rd attempt:
  - MQTT Client logged that we successfully subscribe to 100 topics (dt/test/1 -> dt/test/100)
  - But only received messages from the first 50 topics (dt/test/1 -> dt/test/50) ✅

#### Case 3: Reconnect and resubscribe to 100 topics

1. 1st attempt:

Before turn off internet connection:

- MQTT Client logged that we successfully subscribe to 100 topics (dt/test/1 -> dt/test/100)
- But only received messages from 50 topics (dt/test/1 -> dt/test/50) ✅

Turn off and then turn on the connection, MQTT resubscribe to 100 topics:

- MQTT Client logged that we successfully subscribe to 100 topics (dt/test/1 -> dt/test/100)
- Received messages from 50 topics (dt/test/1 -> dt/test/100) 🤔

2. 2nd attempt:

Before turn off internet connection:

- MQTT Client logged that we successfully subscribe to 100 topics (dt/test/1 -> dt/test/100)
- But only received messages from 50 topics (dt/test/1 -> dt/test/50) ✅

Turn off and then turn on the connection, MQTT resubscribe to 100 topics:

- MQTT Client logged that we successfully subscribe to 100 topics (dt/test/1 -> dt/test/100)
- Received messages from 50 topics (dt/test/1 -> dt/test/100) 🤔
