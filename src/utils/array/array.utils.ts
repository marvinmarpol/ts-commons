/**
 * Array and collection utility functions for big data processing
 */

/**
 * Split array into chunks of specified size
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Generator function to iterate over items in batches
 */
export function* batchIterator<T>(
  iterable: Iterable<T>,
  size: number,
): Generator<T[]> {
  let batch: T[] = [];
  for (const item of iterable) {
    batch.push(item);
    if (batch.length === size) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length) yield batch;
}

/**
 * Group array items by key
 */
export function groupBy<T, K extends string | number | symbol>(
  list: T[],
  key: (item: T) => K,
): Record<K, T[]> {
  return list.reduce(
    (acc, item) => {
      const k = key(item);
      acc[k] = acc[k] || [];
      acc[k].push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

/**
 * Create index/map from array by key
 */
export function indexBy<T, K extends string | number | symbol>(
  list: T[],
  key: (item: T) => K,
): Record<K, T> {
  return list.reduce(
    (acc, item) => {
      acc[key(item)] = item;
      return acc;
    },
    {} as Record<K, T>,
  );
}

/**
 * Sum array values by selector function
 */
export function sumBy<T>(list: T[], selector: (item: T) => number): number {
  return list.reduce((sum, item) => sum + selector(item), 0);
}
