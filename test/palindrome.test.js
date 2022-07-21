const { palindrome } = require('./fortesting/util');

test('oso expected oso', () => {
  expect(palindrome('oso')).toBe('oso');
});


test('hola expected hola', () => {
  expect(palindrome('hola')).toBe('aloh');
});

test('palindrome of empty string', () => {
  expect(palindrome('')).toBeUndefined();
});

//corner case
test('palindrome of empty undefined', () => {
  expect(palindrome(undefined)).toBeUndefined();
}); 
