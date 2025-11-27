import { Response } from "express";

export const setAuthCookies = (res: Response, access: string | null, refresh: string | null) => {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("accesstoken", access, {
    httpOnly: true,
    sameSite: "none",
    secure: isProd,
    maxAge:  60 * 60 * 1000, 
    // 15 min in ms
    path: "/",
  });

  res.cookie("refreshtoken", refresh, {
    httpOnly: true,
    sameSite: "none",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    // 7 days 
    path: "/",
  });
};


export const setAdminAuthCookie = (res:Response,access:string | null)=>{
   const isProd = process.env.NODE_ENV === "production";
  res.cookie('adminToken',access,{
 httpOnly:true,
 sameSite:"none",
 secure:isProd,
 maxAge:7 * 24 * 60 * 60 * 1000,
 path:"/"
  })
}
