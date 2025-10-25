import crypto from "crypto";
import bcrypt from "bcryptjs";

export const hashPassAndGenerateToken = async ():Promise<{cryptoToken:string}> => {
    const cryptoToken = crypto.randomBytes(32).toString("hex")
 
    return {cryptoToken};
}