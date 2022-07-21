function palindrome(word) {
  if (!word) {
    return undefined;
  }

  return word.split('').reverse().join('')
}
const average = array => {
  if (arrar.length === 0) {
    return 0;
  }
  let sum = 0;
  array.forEach(num => {
    sum += num;
  });
  return sum / array.length;
}

module.exports = {
  palindrome,
  average
}