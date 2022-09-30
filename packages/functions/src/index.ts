import * as functions from 'firebase-functions';
import { Message } from 'schema';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFunctions } from 'firebase-admin/functions';
import { getFirestore } from 'firebase-admin/firestore';

/* ---------------------------------- Setup --------------------------------- */
initializeApp({ credential: applicationDefault() });

/* ---------------------------------- Queue --------------------------------- */

const randomIntFromInterval = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const daysToSeconds = (days: number) => {
    return days * 24 * 60 * 60;
};

/**
 * Adds a message to the queue, which will be processed after a random delay.
 * The message includes all relevant information such that the queue handler is able
 * to send the message to the desired recipients after the delay duration
 */
export const queueMessage = functions.https.onCall(async (data, context) => {
    // Validate authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'User is not authenticated');
    }

    // Get the queue message function
    const queue = getFunctions().taskQueue(queueMessage.name);

    // Add random delay between 1 and 15 days
    // const delaySeconds = randomIntFromInterval(daysToSeconds(1), daysToSeconds(15));
    const delaySeconds = 60; // temp for testing
    const receiveTime = new Date(new Date().getTime() + delaySeconds * 1000);

    // Extract arguments from body
    const message = Message.parse({ ...data, receiveTime });

    // Enqueue the message
    queue.enqueue({ data: message }, { scheduleDelaySeconds: delaySeconds });
});

/* --------------------------------- Handle --------------------------------- */

const RETRY_CONFIG: functions.tasks.RetryConfig = {
    maxAttempts: 3,
    minBackoffSeconds: 300,
};

/**
 * Processes a message on the queue, by sending it to the desired recipient.
 */
export const sendMessage = functions.tasks
    .taskQueue({ retryConfig: RETRY_CONFIG })
    .onDispatch(async (data) => {
        // Get the reference to firestore
        const store = getFirestore();

        // Extract arguments from body
        const message = Message.parse(data);

        // Add the message to firestore
        await store.collection('messages').add(message);
    });
