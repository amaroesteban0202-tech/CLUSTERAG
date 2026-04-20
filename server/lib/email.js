import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

const hasSmtpConfig = () => Boolean(env.smtp.host && env.smtp.user && env.smtp.password);

const getTransporter = () => {
    if (!hasSmtpConfig()) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: env.smtp.host,
            port: env.smtp.port,
            secure: env.smtp.secure,
            auth: {
                user: env.smtp.user,
                pass: env.smtp.password
            }
        });
    }
    return transporter;
};

export const sendMagicLinkEmail = async ({ email, name, link, expiresAt }) => {
    const mailer = getTransporter();
    const subject = 'Acceso a Cluster Agency OS';
    const html = `
        <div style="font-family: Arial, sans-serif; color: #0f172a;">
            <h2>Hola${name ? ` ${name}` : ''}</h2>
            <p>Usa este enlace para iniciar sesion en Cluster Agency OS:</p>
            <p><a href="${link}">${link}</a></p>
            <p>Expira en ${expiresAt}.</p>
        </div>
    `;

    if (!mailer) {
        console.info(`[magic-link:${email}] ${link}`);
        return { mode: 'console' };
    }

    await mailer.sendMail({
        from: env.smtp.from,
        to: email,
        subject,
        html
    });

    return { mode: 'smtp' };
};
