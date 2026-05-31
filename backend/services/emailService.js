import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
import { getEmailTemplate } from './emailTemplates.js';


const isEmailConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.EMAIL_FROM
);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const emailQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (emailQueue.length) {
    const mail = emailQueue.shift();
    try {
      await sendMail(mail);
      console.log('[EMAIL SERVICE] Email queued and sent to', mail.to);
    } catch (error) {
      console.error('[EMAIL SERVICE] Failed to send queued email:', error?.message || error);
    }
  }

  isProcessingQueue = false;
};

const sendMail = async ({ to, subject, html, text, from }) => {
  if (!isEmailConfigured || !transporter) {
    console.warn('[EMAIL SERVICE] SMTP is not configured. Skipping email to', to);
    return;
  }

  if (!to) {
    throw new Error('Email recipient is required');
  }

  await transporter.sendMail({
    from: from || process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
};

export const enqueueEmail = (mailOptions) => {
  if (!mailOptions || !mailOptions.to) return;
  emailQueue.push(mailOptions);
  setImmediate(processQueue);
};

export const sendTemplateEmail = ({ to, templateName, templateData, subject }) => {
  const template = getEmailTemplate(templateName, templateData);
  enqueueEmail({
    to,
    subject: subject || template.subject,
    html: template.html,
    text: template.text,
  });
};

export const sendBulkTemplateEmail = ({ recipients, templateName, templateData, subject, customData }) => {
  if (!Array.isArray(recipients) || recipients.length === 0) return;

  recipients.forEach((recipient) => {
    if (!recipient?.email) return;
    const data = typeof customData === 'function' ? customData(recipient) : { ...templateData, user: recipient };
    const template = getEmailTemplate(templateName, data);
    enqueueEmail({
      to: recipient.email,
      subject: typeof subject === 'function' ? subject(recipient) : subject || template.subject,
      html: template.html,
      text: template.text,
    });
  });
};

export const sendNotificationEmail = async ({ to, subject, message, actionText, actionUrl, footer, templateName, templateData }) => {
  const template = templateName ? getEmailTemplate(templateName, templateData) : {
    subject: subject || 'Smart Placement Tracker update',
    html: getEmailTemplate('default', { title: subject, message, actionText, actionUrl, footer }).html,
    text: getEmailTemplate('default', { title: subject, message, actionText, actionUrl, footer }).text,
  };

  enqueueEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};
