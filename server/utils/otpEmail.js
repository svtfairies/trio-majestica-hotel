const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp) => {
    const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: [email],
        subject: "Hotel Verification Code",
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Trio Majestica Hotel Verification</title>
            </head>

            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif; color: #172033;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e5ea;">

                                <tr>
                                    <td style="height: 4px; background: linear-gradient(90deg, #8f1111, #c92716, #f36a21);"></td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding: 42px 30px 30px;">

                                        <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border: 1px solid #c9a77c; transform: rotate(45deg); margin-bottom: 18px;">
                                            <span style="display: inline-block; transform: rotate(-45deg); font-family: Georgia, 'Times New Roman', serif; font-size: 25px; font-weight: bold; color: #c9a77c;">
                                                TM
                                            </span>
                                        </div>

                                        <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; color: #172033; font-weight: 600;">Trio Majestica</div>
                                        <div style="margin-top: 9px; color: #a77d4e; font-size: 9px; font-weight: bold; letter-spacing: 4px;">HOTEL</div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 10px 45px 45px;">

                                        <div style="border-top: 1px solid #eceff3; padding-top: 30px;">
                                            <h1 style="margin: 0 0 18px; font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 400; line-height: 1.2; color: #172033;">
                                                Your verification code
                                            </h1>

                                            <p style="margin: 0 0 28px; color: #737d8c; font-size: 14px; line-height: 1.7;">
                                                Use the verification code below to continue with your Trio Majestica Hotel account.
                                            </p>

                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td align="center" style="background: linear-gradient(135deg, #ef4444, #f97316, #fb923c); padding: 2px; border-radius: 14px;">
                                                        <div style="background-color: #fffdf9; border-radius: 12px; padding: 25px 15px;">
                                                            <div style="font-size: 34px; font-weight: 700; letter-spacing: 9px; color: #1d293d;">${otp}</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>

                                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                                                <tr>
                                                    <td style="padding: 15px 18px; background-color: #fff8ef; border-left: 3px solid #c9a77c;">

                                                        <p style="margin: 0; color: #66594b; font-size: 12px; line-height: 1.6;">
                                                            This verification code is valid for
                                                            <strong style="color: #172033;">10 minutes</strong>.
                                                        </p>

                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin: 28px 0 0; color: #8a929f; font-size: 12px; line-height: 1.7;">If you did not request this verification code, you can safely ignore this email. Your account remains secure.</p>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="background-color: #172033; padding: 28px 30px; text-align: center;">
                                        <p style="margin: 0 0 8px; color: #ffffff; font-family: Georgia, 'Times New Roman', serif; font-size: 16px;">Trio Majestica Hotel</p>
                                        <p style="margin: 0; color: #aeb6c2; font-size: 10px; letter-spacing: 1px;">HOTEL MANAGEMENT SYSTEM</p>
                                    </td>
                                </tr>

                            </table>

                        </td>
                    </tr>
                </table>

            </body>
            </html>
        `,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

module.exports = {
    sendOTPEmail,
};