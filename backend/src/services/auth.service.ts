import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { sign, verify } from 'hono/jwt';
import { env } from '../config/env.js';
import { UserRepository } from '../repositories/user.repository.js';
import type { UserResponse, AuthTokenPayload } from '../types/index.js';
import type { RegisterInput, LoginInput } from '../validators/auth.validator.js';

export class AuthService {
  private static readonly TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 30; // 30 days

  static async register(input: RegisterInput): Promise<{ user: UserResponse; token: string }> {
    const existing = UserRepository.findByUsername(input.username);
    if (existing) {
      throw new Error('Username is already taken');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);
    const userId = randomUUID();

    const created = UserRepository.create({
      id: userId,
      username: input.username,
      password_hash: passwordHash
    });

    const token = await this.generateToken(created.id, created.username);

    return {
      user: {
        id: created.id,
        username: created.username,
        created_at: created.created_at
      },
      token
    };
  }

  static async login(input: LoginInput): Promise<{ user: UserResponse; token: string }> {
    const user = UserRepository.findByUsername(input.username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid username or password');
    }

    const token = await this.generateToken(user.id, user.username);

    return {
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at
      },
      token
    };
  }

  static async getUser(userId: string): Promise<UserResponse | null> {
    const user = UserRepository.findById(userId);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      created_at: user.created_at
    };
  }

  static async generateToken(userId: string, username: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload: AuthTokenPayload = {
      sub: userId,
      username,
      iat: now,
      exp: now + this.TOKEN_EXPIRY_SECONDS
    };

    return sign(payload as any, env.JWT_SECRET, 'HS256');
  }

  static async verifyToken(token: string): Promise<AuthTokenPayload | null> {
    try {
      const decoded = await verify(token, env.JWT_SECRET, 'HS256');
      if (!decoded || !decoded.sub) return null;
      return decoded as unknown as AuthTokenPayload;
    } catch {
      return null;
    }
  }
}
