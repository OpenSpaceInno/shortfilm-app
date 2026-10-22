import { SetMetadata } from '@nestjs/common';

export const TRACE_SPAN_KEY = 'observability:trace_span';

export interface TraceSpanMetadata {
  name: string;
  attributes?: Record<string, string>;
}

/**
 * Decorates a controller handler or service method to be traced via OpenTelemetry.
 */
export function TraceSpan(
  name?: string,
  attributes?: Record<string, string>,
): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const spanName = name || String(propertyKey);
    SetMetadata(TRACE_SPAN_KEY, { name: spanName, attributes })(
      target,
      propertyKey,
      descriptor,
    );
    return descriptor;
  };
}
