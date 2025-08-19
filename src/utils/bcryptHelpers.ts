import bcrypt from 'bcryptjs';


export const hashPassWord = async(password:string)=>{
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password,salt);
    return hashedPassword
}