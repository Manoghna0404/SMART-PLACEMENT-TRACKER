import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'manoghnalakshmi@gmail.com',
    pass: 'uipazetleqedysrx',
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    console.log('[EMAIL SERVICE] Sending email to:', to);

    const info = await transporter.sendMail({
      from: '"Smart Placement Tracker" <manoghnalakshmi@gmail.com>',
      to,
      subject,
      text,
    });

    console.log('[EMAIL SERVICE] Email sent:', info.messageId);
  } catch (error) {
    console.log('[EMAIL SERVICE ERROR]', error);
  }
};

export default sendEmail;