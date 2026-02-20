import { batchIterator, chunk, groupBy, indexBy, sumBy } from "./array.utils";


describe('Array Utils', () => {
  describe('chunk', () => {
    describe('when given an array and chunk size', () => {
      it('should split array into chunks of specified size', () => {
        const input = [1, 2, 3, 4, 5, 6, 7];
        const result = chunk(input, 3);

        expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
      });

      it('should handle array length that is multiple of chunk size', () => {
        const input = [1, 2, 3, 4, 5, 6];
        const result = chunk(input, 2);

        expect(result).toEqual([
          [1, 2],
          [3, 4],
          [5, 6],
        ]);
      });

      it('should return single chunk when chunk size is larger than array', () => {
        const input = [1, 2, 3];
        const result = chunk(input, 10);

        expect(result).toEqual([[1, 2, 3]]);
      });

      it('should return empty array when input is empty', () => {
        const result = chunk([], 3);

        expect(result).toEqual([]);
      });

      it('should handle chunk size of 1', () => {
        const input = [1, 2, 3];
        const result = chunk(input, 1);

        expect(result).toEqual([[1], [2], [3]]);
      });
    });

    describe('when working with objects', () => {
      it('should chunk array of objects correctly', () => {
        const input = [
          { id: 1, name: 'maikel' },
          { id: 2, name: 'ricky' },
          { id: 3, name: 'reza' },
        ];
        const result = chunk(input, 2);

        expect(result).toEqual([
          [
            { id: 1, name: 'maikel' },
            { id: 2, name: 'ricky' },
          ],
          [{ id: 3, name: 'reza' }],
        ]);
      });
    });
  });

  describe('batchIterator', () => {
    describe('when iterating over items', () => {
      it('should yield batches of specified size', () => {
        const input = [1, 2, 3, 4, 5, 6, 7];
        const batches = Array.from(batchIterator(input, 3));

        expect(batches).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
      });

      it('should yield final partial batch', () => {
        const input = [1, 2, 3, 4, 5];
        const batches = Array.from(batchIterator(input, 2));

        expect(batches).toEqual([[1, 2], [3, 4], [5]]);
      });

      it('should handle empty iterable', () => {
        const batches = Array.from(batchIterator([], 3));

        expect(batches).toEqual([]);
      });

      it('should work with Set as iterable', () => {
        const input = new Set([1, 2, 3, 4, 5]);
        const batches = Array.from(batchIterator(input, 2));

        expect(batches).toEqual([[1, 2], [3, 4], [5]]);
      });
    });

    describe('when used in for-of loop', () => {
      it('should iterate correctly', () => {
        const input = [1, 2, 3, 4, 5];
        const results: number[][] = [];

        for (const batch of batchIterator(input, 2)) {
          results.push(batch);
        }

        expect(results).toEqual([[1, 2], [3, 4], [5]]);
      });
    });
  });

  describe('groupBy', () => {
    describe('when grouping by a key function', () => {
      it('should group items by returned key', () => {
        const input = [
          { type: 'fruit', name: 'apple' },
          { type: 'vegetable', name: 'carrot' },
          { type: 'fruit', name: 'banana' },
          { type: 'vegetable', name: 'broccoli' },
        ];

        const result = groupBy(input, (item) => item.type);

        expect(result).toEqual({
          fruit: [
            { type: 'fruit', name: 'apple' },
            { type: 'fruit', name: 'banana' },
          ],
          vegetable: [
            { type: 'vegetable', name: 'carrot' },
            { type: 'vegetable', name: 'broccoli' },
          ],
        });
      });

      it('should handle numeric keys', () => {
        const input = [
          { age: 20, name: 'niko' },
          { age: 30, name: 'rexy' },
          { age: 20, name: 'irsyad' },
        ];

        const result = groupBy(input, (item) => item.age);

        expect(result).toEqual({
          20: [
            { age: 20, name: 'niko' },
            { age: 20, name: 'irsyad' },
          ],
          30: [{ age: 30, name: 'rexy' }],
        });
      });

      it('should return empty object for empty array', () => {
        const result = groupBy([], (item) => item);

        expect(result).toEqual({});
      });

      it('should handle single item', () => {
        const input = [{ status: 'active', id: 1 }];
        const result = groupBy(input, (item) => item.status);

        expect(result).toEqual({
          active: [{ status: 'active', id: 1 }],
        });
      });
    });

    describe('when grouping by computed values', () => {
      it('should group by first letter', () => {
        const input = ['apple', 'apricot', 'banana', 'blueberry', 'cherry'];
        const result = groupBy(input, (item) => item[0] as string);

        expect(result).toEqual({
          a: ['apple', 'apricot'],
          b: ['banana', 'blueberry'],
          c: ['cherry'],
        });
      });
    });
  });

  describe('indexBy', () => {
    describe('when creating index from array', () => {
      it('should create map with unique keys', () => {
        const input = [
          { id: 1, name: 'maikel' },
          { id: 2, name: 'ricky' },
          { id: 3, name: 'reza' },
        ];

        const result = indexBy(input, (item) => item.id);

        expect(result).toEqual({
          1: { id: 1, name: 'maikel' },
          2: { id: 2, name: 'ricky' },
          3: { id: 3, name: 'reza' },
        });
      });

      it('should use last item when keys collide', () => {
        const input = [
          { id: 1, name: 'niko' },
          { id: 1, name: 'rexy' },
          { id: 2, name: 'irsyad' },
        ];

        const result = indexBy(input, (item) => item.id);

        expect(result).toEqual({
          1: { id: 1, name: 'rexy' },
          2: { id: 2, name: 'irsyad' },
        });
      });

      it('should handle string keys', () => {
        const input = [
          { code: 'IDR', rate: 1.0 },
          { code: 'EUR', rate: 0.85 },
          { code: 'GBP', rate: 0.73 },
        ];

        const result = indexBy(input, (item) => item.code);

        expect(result).toEqual({
          IDR: { code: 'IDR', rate: 1.0 },
          EUR: { code: 'EUR', rate: 0.85 },
          GBP: { code: 'GBP', rate: 0.73 },
        });
      });

      it('should return empty object for empty array', () => {
        const result = indexBy([], (item) => item);

        expect(result).toEqual({});
      });
    });
  });

  describe('sumBy', () => {
    describe('when summing numeric properties', () => {
      it('should sum values using selector function', () => {
        const input = [
          { price: 10, quantity: 2 },
          { price: 20, quantity: 1 },
          { price: 15, quantity: 3 },
        ];

        const result = sumBy(input, (item) => item.price * item.quantity);

        expect(result).toBe(85);
      });

      it('should return 0 for empty array', () => {
        const result = sumBy([], (item) => item);

        expect(result).toBe(0);
      });

      it('should handle single item', () => {
        const input = [{ value: 42 }];
        const result = sumBy(input, (item) => item.value);

        expect(result).toBe(42);
      });

      it('should sum simple numeric array', () => {
        const input = [1, 2, 3, 4, 5];
        const result = sumBy(input, (item) => item);

        expect(result).toBe(15);
      });

      it('should handle negative numbers', () => {
        const input = [{ amount: 100 }, { amount: -50 }, { amount: 25 }, { amount: -10 }];

        const result = sumBy(input, (item) => item.amount);

        expect(result).toBe(65);
      });

      it('should handle decimal numbers', () => {
        const input = [{ price: 10.5 }, { price: 20.25 }, { price: 15.75 }];

        const result = sumBy(input, (item) => item.price);

        expect(result).toBe(46.5);
      });
    });
  });
});
