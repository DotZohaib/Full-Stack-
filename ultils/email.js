const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1. Create a transporter (the service that sends email)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        //service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
        // Activate in gmail "less secure app" option
    });

    // 2. Defince the email options
    const mailOptions = {
        from: 'Le Anh Tuan <letgo237@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
        //html:
    };

    // 3. Actually send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
