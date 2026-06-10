const generateReferralCode = () => {
  const characters =
    "abcdefghijklmnopqrstuvwxyz0123456789";

  let referralCode = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(
      Math.random() * characters.length
    );

    referralCode += characters[randomIndex];
  }

  return referralCode;
};

export default generateReferralCode;