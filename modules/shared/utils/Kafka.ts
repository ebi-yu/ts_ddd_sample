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
