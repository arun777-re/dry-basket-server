import crypto from "crypto";

export const hashPassAndGenerateToken = async ():Promise<{cryptoToken:string}> => {
    const cryptoToken = crypto.randomBytes(32).toString("hex")
 
    return {cryptoToken};
}