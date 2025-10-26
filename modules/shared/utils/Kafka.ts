import { Kafka } from 'kafkajs';

const DEFAULT_KAFKA_BROKER = 'localhost:9092';

export function resolveKafkaBrokers(): string[] {
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) {
    return [DEFAULT_KAFKA_BROKER];
  }
  return brokers
    .split(',')
    .map((broker) => broker.trim())
    .filter((broker) => broker.length > 0);
}

export async function verifyKafkaConnectivity(
  brokers: string[] = resolveKafkaBrokers(),
): Promise<void> {
  const kafka = new Kafka({ brokers });
  const admin = kafka.admin();

  try {
    await admin.connect();
    await admin.listTopics();
  } finally {
    await admin.disconnect();
  }
}

export async function ensureKafkaTopics(
  topics: string[],
  brokers: string[] = resolveKafkaBrokers(),
): Promise<void> {
  const normalizedTopics = topics
    .map((topic) => topic.trim())
    .filter((topic) => topic.length > 0);
  if (normalizedTopics.length === 0) return;

  const kafka = new Kafka({ brokers });
  const admin = kafka.admin();

  try {
    await admin.connect();
    const existingTopics = new Set(await admin.listTopics());
    const topicsToCreate = normalizedTopics.filter((topic) => !existingTopics.has(topic));
    if (topicsToCreate.length === 0) return;

    await admin.createTopics({
      waitForLeaders: true,
      topics: topicsToCreate.map((topic) => ({ topic })),
    });
  } finally {
    await admin.disconnect();
  }
}
