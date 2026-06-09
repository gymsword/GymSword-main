import bcrypt from "bcryptjs";

const hash = await bcrypt.hash("#Sword@2024", 10);

console.log(hash);