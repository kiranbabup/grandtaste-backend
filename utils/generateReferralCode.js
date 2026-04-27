const generateReferralCode = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  const getRandomChars = (source, count) => {
    let result = '';
    for (let i = 0; i < count; i++) {
      result += source.charAt(Math.floor(Math.random() * source.length));
    }
    return result;
  };

  const part1 = getRandomChars(letters, 3);
  const part2 = getRandomChars(numbers, 3);
  const part3 = getRandomChars(letters, 2);

  return `${part1}${part2}${part3}`;
};

export default generateReferralCode;
