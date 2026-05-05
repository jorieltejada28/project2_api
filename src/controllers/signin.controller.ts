import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import db from '../config/connection.js';
import type { User } from '../models/user.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import 'dotenv/config';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET!;

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body; // This is the 'code' from the frontend

    if (!code) {
        res.status(400).json({ message: 'Authorization code is required' });
        return;
    }

    try {
        // 1. Initialize client with the Secret (required for code exchange)
        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'postmessage'
        );

        // 2. EXCHANGE the code for tokens
        const { tokens } = await client.getToken(code);
        const idToken = tokens.id_token;

        if (!idToken) {
            res.status(400).json({ message: 'Failed to retrieve ID token from Google' });
            return;
        }

        // 3. VERIFY the ID token to get user profile
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID || '',
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.sub) {
            res.status(401).json({ message: 'Invalid Google token payload' });
            return;
        }

        const { sub: google_id, name, picture } = payload;

        // 4. DATABASE logic (Keep your existing MySQL logic)
        const [existingUsers] = await db.query<(RowDataPacket & User)[]>(
            'SELECT * FROM users WHERE google_id = ?',
            [google_id]
        );

        let user: Partial<User>;

        if (existingUsers.length === 0) {
            const [result] = await db.query<ResultSetHeader>(
                'INSERT INTO users (google_id, name, picture, status) VALUES (?, ?, ?, ?)',
                [google_id, name, picture, 'active']
            );

            user = {
                id: result.insertId,
                google_id,
                name: name || 'Anonymous',
                picture: picture || null
            };
        } else {
            user = existingUsers[0]!;
        }

        // 5. Generate your App's JWT
        const appToken = jwt.sign(
            { id: user.id, google_id: user.google_id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token: appToken,
            user: {
                id: user.id,
                name: user.name,
                picture: user.picture
            }
        });

    } catch (error) {
        // Log the actual error to your terminal so you can see why it failed
        console.error('Full Auth Error:', error);
        res.status(500).json({ message: 'Internal server error during Google Auth' });
    }
};