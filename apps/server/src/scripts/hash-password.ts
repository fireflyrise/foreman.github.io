import bcrypt from "bcryptjs";

const pw = process.argv[2];
if (!pw) {
  console.error("Usage: pnpm --filter @foreman/server hash-password '<password>'");
  process.exit(1);
}
const hash = bcrypt.hashSync(pw, 12);
console.log(hash);
