function generateRandomEmployeeCode(): string {
  // Generate a random integer between 0 and 99999
  const randomNumber = Math.floor(Math.random() * 100000);
  
  // Pad with leading zeros to ensure it is always exactly 5 digits
  const paddedNumber = String(randomNumber).padStart(5, '0');
  
  return `POH-${paddedNumber}`;
}

export default generateRandomEmployeeCode;