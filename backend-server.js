const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8081;
const SIGNUPS_FILE = path.join(__dirname, 'beta-signups.json');

// Initialize signups file if it doesn't exist
if (!fs.existsSync(SIGNUPS_FILE)) {
    fs.writeFileSync(SIGNUPS_FILE, JSON.stringify([], null, 2));
}

// Load existing signups
let betaSignups = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8'));

// Middleware
// Configure CORS for production
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Save signups to file
const saveSignups = () => {
    fs.writeFileSync(SIGNUPS_FILE, JSON.stringify(betaSignups, null, 2));
};

// --- Email setup -----------------------------------------------------------

let transporterPromise = null;

function resolveBoolean(envValue, defaultValue = true) {
    if (typeof envValue !== 'string') {
        return defaultValue;
    }
    return ['1', 'true', 'yes', 'y', 'on'].includes(envValue.trim().toLowerCase());
}

async function getBrevoTransporter() {
    if (transporterPromise) {
        return transporterPromise;
    }

    const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
    const port = Number(process.env.BREVO_SMTP_PORT || '587');
    const login = process.env.BREVO_SMTP_LOGIN;
    const password = process.env.BREVO_SMTP_PASSWORD;

    if (!login || !password) {
        console.warn(
            '[mail] Missing BREVO_SMTP_LOGIN or BREVO_SMTP_PASSWORD environment variables. ' +
            'Emails will not be sent.'
        );
        transporterPromise = null;
        return null;
    }

    const useSecure = port === 465;
    const requireTLS = resolveBoolean(process.env.BREVO_SMTP_STARTTLS, !useSecure);

    transporterPromise = nodemailer.createTransport({
        host,
        port,
        secure: useSecure,
        requireTLS,
        auth: {
            user: login,
            pass: password,
        },
    });

    try {
        await transporterPromise.verify();
        console.log('[mail] Brevo SMTP transporter verified successfully.');
    } catch (error) {
        console.error('[mail] Failed to verify Brevo SMTP transporter:', error);
        transporterPromise = null;
        return null;
    }

    return transporterPromise;
}

async function sendSignupEmail({ username, email }) {
    const transporter = await getBrevoTransporter();
    if (!transporter) {
        return;
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@elite-score.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Elite Score';
    const notificationEmail = process.env.BREVO_NOTIFICATIONS_EMAIL;

    const subject = 'Welcome to the Elite Score beta waitlist';
    const textContent = [
        `Hi ${username || 'there'},`,
        '',
        'Thanks for joining the Elite Score beta waitlist!',
        'We will reach out as soon as we open the gates to the next cohort.',
        '',
        'Stay ambitious,',
        'The Elite Score Team',
    ].join('\n');

    const htmlContent = `
      <p>Hi ${username || 'there'},</p>
      <p>Thanks for joining the <strong>Elite Score</strong> beta waitlist! 🎉</p>
      <p>We will reach out as soon as we open the gates to the next cohort.</p>
      <p>Stay ambitious,<br/>The Elite Score Team</p>
    `;

    const message = {
        from: `"${senderName}" <${senderEmail}>`,
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
    };

    if (notificationEmail) {
        message.bcc = notificationEmail;
    }

    try {
        await transporter.sendMail(message);
        console.log('[mail] Signup confirmation email sent to:', email);
    } catch (error) {
        console.error('[mail] Failed to send signup confirmation email:', error);
    }
}

// ---------------------------------------------------------------------------

// Pre-signup endpoint
app.post('/v1/auth/pre-signup', async (req, res) => {
    const { username, email } = req.body;

    console.log('Received signup request:', { username, email });

    if (!username || !email) {
        return res.status(400).json({
            success: false,
            message: "All fields must be completed",
            data: null
        });
    }

    // Check if email already exists
    const exists = betaSignups.find(signup => signup.email === email);
    if (exists) {
        console.log('Duplicate email detected:', email);
        return res.status(401).json({
            success: false,
            message: "User with this email already exists",
            data: null
        });
    }

    // Add to signups
    const newSignup = { username, email, timestamp: new Date().toISOString() };
    betaSignups.push(newSignup);
    saveSignups();

    console.log('New beta signup added:', newSignup);
    console.log('Total signups:', betaSignups.length);

    // Try to send a confirmation email (non-blocking for the API response)
    sendSignupEmail({ username, email }).catch((error) => {
        console.error('[mail] Unexpected error while sending signup email:', error);
    });

    return res.status(200).json({
        success: true,
        message: "User registered successfully",
        data: null
    });
});

// Status endpoint
app.get('/v1/status', (req, res) => {
    res.json({
        status: 'ok',
        signups: betaSignups.length,
        uptime: process.uptime()
    });
});

// List signups (for testing)
app.get('/v1/signups', (req, res) => {
    res.json({
        success: true,
        count: betaSignups.length,
        data: betaSignups
    });
});

// Health check
app.get('/', (req, res) => {
    res.send('Beta Signup Backend Server is running!');
});

app.listen(PORT, () => {
    console.log(`\n🚀 Beta Signup Backend Server is running!`);
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`\n📌 Available endpoints:`);
    console.log(`   POST /v1/auth/pre-signup - Register for beta`);
    console.log(`   GET  /v1/status         - Check server status`);
    console.log(`   GET  /v1/signups        - List all signups`);
    console.log(`\n💾 Signups are saved to: ${SIGNUPS_FILE}`);
    console.log(`📊 Current signups: ${betaSignups.length}`);
    console.log('\n✨ Ready to accept beta signups!\n');
});