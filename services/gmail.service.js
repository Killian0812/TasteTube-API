const nodemailer = require('nodemailer');
const { FirebaseAuth } = require('../firebase');

const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/taste-tube.appspot.com/o/tastetube_inverted.png?alt=media&token=28a805b8-57f5-4014-a379-8545d9b6bf74';

const sendVerificationLink = async (email) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_ADDRESS,
            pass: process.env.APP_PASSWORD
        }
    });

    const verificationLink = await FirebaseAuth.generateEmailVerificationLink(email);

    const htmlContent = `
        <div style="background-color: #f4f4f4; padding: 20px;">
            <img src=${logoUrl} alt="TasteTube" style="display: block; margin: 0 auto; width: 150px; height: auto;">
            <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; margin-top: 20px;">
                <p style="font-size: 18px;">Email verification link</p>
                <p>We have received a register request from your account.</p>
                <p>Please click on the following link to verify your email:</p>
                <a href="${verificationLink}" style="background-color: #C5221F; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 10px;">Verify your email</a>
                <p>Thank you,<br>TasteTube</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: 'chatk.enterprise@gmail.com',
        to: email,
        subject: 'TasteTube - Email Verification',
        html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification link sent to ${email}`);
};

const sendRecoverLink = async (email, username) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_ADDRESS,
            pass: process.env.APP_PASSWORD
        }
    });

    const recoverLink = await FirebaseAuth.generatePasswordResetLink(email);

    const htmlContent = `
        <div style="background-color: #f4f4f4; padding: 20px;">
            <img src=${logoUrl} alt="ChatK Logo" style="display: block; margin: 0 auto; width: 150px; height: auto;">
            <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; margin-top: 20px;">
                <p style="font-size: 18px;">Hello ${username},</p>
                <p>We have received a request to recover your account.</p>
                <p>Please click on the following link to reset your password and regain access to your account:</p>
                <a href="${recoverLink}" style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 10px;">Reset Password</a>
                <p>Please note that the recovery link will expire in one hour.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Thank you,<br>ChatK</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: 'chatk.enterprise@gmail.com',
        to: email,
        subject: 'TasteTube - Account Recovery',
        html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Recovery link sent to ${email}`);
};

module.exports = { sendVerificationLink, sendRecoverLink }