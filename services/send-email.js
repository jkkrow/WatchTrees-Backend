const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

const sendEmail = async (options) => {
  const client = new OAuth2Client(
    process.env.EMAIL_CLIENT_ID,
    process.env.EMAIL_CLIENT_SECRET,
    process.env.EMAIL_REDIRECT_URI
  );

  client.setCredentials({
    refresh_token: process.env.EMAIL_REFRESH_TOKEN,
  });

  const accessToken = await client.getAccessToken();

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      type: process.env.EMAIL_TYPE,
      user: process.env.EMAIL_USERNAME,
      clientId: process.env.EMAIL_CLIENT_ID,
      clientSecret: process.env.EMAIL_CLIENT_SECRET,
      refreshToken: process.env.EMAIL_REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
