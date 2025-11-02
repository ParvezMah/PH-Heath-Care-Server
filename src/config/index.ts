import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    cloudinary: {
        api_secret: process.env.CLOUDINARY_API_SECRET,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY
    },
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecreyKey: process.env.STRIPE_WEBHOOK_SECKRET_KEY,
    emailSender: {
        email: process.env.EMAIL,
        app_pass: process.env.APP_PASS
    },
    jwt: {
        jwt_secret: process.env.JWT_ACCESS_SECRET,
        expires_in: process.env.JWT_ACCESS_EXPIRES,
        refresh_token_secret: process.env.JWT_REFRESH_SECRET,
        refresh_token_expires_in: process.env.JWT_REFRESH_EXPIRES,
        reset_pass_secret: process.env.RESET_PASS_TOKEN,
        reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN
    },
    salt_round: process.env.BCRYPT_SALT_ROUND,
    reset_pass_link: process.env.RESET_PASS_LINK
}