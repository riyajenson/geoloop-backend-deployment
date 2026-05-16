import * as authService from '../services/authService.js'

function handleError(res, error) {
  const statusCode = error.statusCode || 500
  const message = error.message || 'Authentication failed. Please try again.'
  const code = error.code || 'AUTH_FAILED'

  return res.status(statusCode).json({
    success: false,
    message,
    code,
  })
}

export async function signup(req, res) {
  try {
    const { email, password, username } = req.body

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, and username',
        code: 'VALIDATION_ERROR',
      })
    }

    const { user, profile, stats } = await authService.signup({ email, password, username })

    return res.status(201).json({
      success: true,
      user,
      profile,
      stats,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email and password',
        code: 'VALIDATION_ERROR',
      })
    }

    const result = await authService.login({ email, password })

    return res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export async function logout(req, res) {
  try {
    const result = await authService.logout()

    return res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error) {
    return handleError(res, error)
  }
}
