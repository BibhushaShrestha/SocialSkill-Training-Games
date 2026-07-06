import twilio from 'twilio';

let client = null;

export function getSmsClient() {
  if (client) return client;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (sid && token) {
    client = twilio(sid, token);
    console.log('Twilio SMS client initialized');
  } else {
    console.log('Twilio not configured — OTP will be displayed on screen only');
  }

  return client;
}

export async function sendOtpSms(toPhone, otp) {
  const twilioClient = getSmsClient();

  if (!twilioClient) {
    console.log(`[DEV] OTP for ${toPhone}: ${otp}`);
    return { devMode: true, otp };
  }

  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    console.log(`[DEV] TWILIO_PHONE_NUMBER not set — OTP for ${toPhone}: ${otp}`);
    return { devMode: true, otp };
  }

  try {
    const message = await twilioClient.messages.create({
      body: `Your password reset OTP is: ${otp}. It expires in 10 minutes.`,
      from,
      to: toPhone,
    });
    console.log(`SMS sent to ${toPhone}: SID ${message.sid}`);
    return { sid: message.sid };
  } catch (err) {
    console.error(`Twilio send failed for ${toPhone}:`, err.message);
    console.log(`[FALLBACK] OTP for ${toPhone}: ${otp}`);
    return { devMode: true, otp };
  }
}
