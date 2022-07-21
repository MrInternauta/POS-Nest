const sum = require('./sum');

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});

test('adds 4 + 9 to equal 13', () => {
  expect(sum(4, 9)).toBe(13);
});