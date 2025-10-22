import nodemailer from 'nodemailer';

 function createTransporter() {
    if(process.env.MAIL_PROVIDER === "gmail"){
        return nodemailer.createTransport({
            service:"gamil",
            auth:{
                type:"OAuth2",
                user:process.env.SMTP_GMAIL_USER,
                clientId:process.env.SMTP_CLIENT_ID,
                clientSecret:process.env.SMTP_CLIENT_SECRET,
                refreshToken:process.env.SMTP_REFRESH_TOKEN,
                accessToken:process.env.SMTP_ACCESS_TOKEN,
            }
        })
    }else if(process.env.MAIL_PROVIDER === "mailgun"){
        return nodemailer.createTransport({
            host:"smtp.mailgun.org",
            port: Number(process.env.MAILGUN_PORT),
            auth:{
                user:process.env.MAILGUN_USER,
                pass:process.env.MAILGUN_PASS,
            }
        })
    }
            }


            // send email for registration verification
            export async function sendEmailWithNodemailer({to,subject,email}:{to:string,subject:string,email:string}) {
                try {
                    const transporter =  createTransporter();
                    if(!transporter){
                        throw new Error("No transporter available");
                    }
                   const result =  await transporter.sendMail({
                        from:`From Dry Basket <${process.env.SMTP_GMAIL_USER}>`,
                        to,
                        subject,
                        html:email,
                    });
                    console.log("Email sent successfully:",result.messageId);
                    return result;
                } catch (error) {
                    console.log("Error sending email:",error);
                    throw new Error("Error sending email");
                }
            }