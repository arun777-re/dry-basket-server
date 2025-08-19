import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "";

export class TokenService {
  static generateAccessToken(id: string) {
    return jwt.sign({ id }, secret, { expiresIn: "7d" });
  }

  static generateRefreshToken(id: string) {
    return jwt.sign({ id }, secret, { expiresIn: "30d" });
  }

  static staticVerifyToken(token: string) {
    return jwt.verify(token, secret);
  }

  static generateRestToken(email:string){
    return jwt.sign({email},secret,{expiresIn:"15m"})
  }
}

