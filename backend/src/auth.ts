import jwt from "jsonwebtoken"

// spell-checker: disable-next-line
const TOKEN_SECRET = "sandiegojsmeetup" // 16 characters
const ACCESS_EXPIRATION = 5 * 60 * 1000 // 5 minutes
const REFRESH_EXPIRATION = 24 * 60 * 60 * 1000 // 24 hours

export type TokenData = {
  name?: string
  isAdmin?: boolean
}

const generateToken = (data: TokenData, expiresIn: number) => jwt.sign(data, TOKEN_SECRET, { expiresIn })

export const getTokens = (data: TokenData) => {
  return {
    ...data,
    exp: Date.now() + ACCESS_EXPIRATION,
    accessToken: generateToken(data, ACCESS_EXPIRATION),
    refreshToken: generateToken(data, REFRESH_EXPIRATION),
  }
}
export type Session = ReturnType<typeof getTokens>

export const parseToken = (token: string) => {
  try {
    return jwt.verify(token, TOKEN_SECRET) as TokenData
  } catch (error) {
    console.error("parse token error", error)
    throw new Error("Invalid token. Please login again.")
  }
}
