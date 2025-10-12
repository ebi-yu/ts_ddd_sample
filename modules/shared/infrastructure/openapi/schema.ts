import { type ZodTypeAny, z } from 'zod';

type AnyZodObject = z.ZodObject<Record<string, ZodTypeAny>>;

interface OpenApiObjectOptions {
  refId?: string;
  object?: Record<string, unknown>;
  properties?: Record<string, Record<string, unknown>>;
}

interface WithOpenApiObjectResult<T extends AnyZodObject> {
  schema: T;
  example?: unknown;
}

/*
 * ZodスキーマにOpenAPIのメタ情報を付与するユーティリティ関数
 */
export const withOpenApiObject = <T extends AnyZodObject>(
  schema: T,
  options: OpenApiObjectOptions,
): WithOpenApiObjectResult<T> => {
  const { refId, object, properties } = options;
  let extended: AnyZodObject = schema;

  if (properties) {
    const shape = schema.shape as Record<string, ZodTypeAny>;
    const overrides: Record<string, ZodTypeAny> = {};

    for (const [key, propertyMeta] of Object.entries(properties)) {
      const target = shape[key];
      if (!target) {
        continue;
      }
      overrides[key] = target.openapi(propertyMeta);
    }

    if (Object.keys(overrides).length > 0) {
      extended = schema.extend(overrides);
    }
  }

  const metadata = object ? { ...object } : {};
  const example = metadata.example;

  if (refId) {
    return { schema: extended.openapi(refId, metadata) as T, example };
  }

  return { schema: extended.openapi(metadata) as T, example };
};
