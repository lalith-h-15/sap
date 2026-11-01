import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

import { User } from '../models/User.js';
import { EmployeeContext } from '../models/EmployeeContext.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const ACCESS_TOKEN_EXPIRY = '2h';

function createToken(user) {
  const secret = new TextEncoder().encode(env.jwtSecret);

  return new SignJWT({
    role: user.role,
    email: user.email
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user._id))
    .setIssuer(env.jwtIssuer)
    .setAudience(env.jwtAudience)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secret);
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role
  };
}

// POST /api/v1/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password, careerGoal } = req.body;

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      throw new HttpError(400, 'Name, email and password are required');
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      throw new HttpError(400, 'Name must be between 2 and 100 characters');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new HttpError(400, 'Please provide a valid email address');
    }

    if (password.length < 8 || password.length > 72) {
      throw new HttpError(400, 'Password must be between 8 and 72 characters');
    }

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      throw new HttpError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Public registration always creates an employee account.
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: 'employee'
    });

    // Connect the account to the existing Career Orchestrator profile model.
    await EmployeeContext.findOneAndUpdate(
      { externalEmployeeId: String(user._id) },
      {
        $setOnInsert: {
          externalEmployeeId: String(user._id),
          source: 'manual',
          name: cleanName,
          careerGoal:
            typeof careerGoal === 'string' && careerGoal.trim()
              ? careerGoal.trim()
              : null
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    const token = await createToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: publicUser(user),
        token,
        tokenType: 'Bearer',
        expiresIn: '2h'
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new HttpError(409, 'An account with this email already exists'));
    }

    next(error);
  }
}

// POST /api/v1/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      throw new HttpError(400, 'Email and password are required');
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail })
      .select('+passwordHash');

    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new HttpError(403, 'This account is inactive');
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const token = await createToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: publicUser(user),
        token,
        tokenType: 'Bearer',
        expiresIn: '2h'
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/auth/me
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.isActive) {
      throw new HttpError(401, 'User account not found or inactive');
    }

    return res.status(200).json({
      success: true,
      data: {
        user: publicUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
}