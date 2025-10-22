import crypto from "crypto";
import bcrypt from "bcryptjs";

export const hashPassAndGenerateToken = async ({password}:{password:string}):Promise<{hashedToken:string,cryptoToken:string}> => {
    const cryptoToken = crypto.randomBytes(32).toString("hex")
    const salt = await bcrypt.genSalt(12)
    const hashedToken = await bcrypt.hash(password,salt);
    return {hashedToken,cryptoToken};
}