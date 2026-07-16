import { signupInit, signupComplete } from '../services/signupService.js'
import supabase from '../config/supabase.js'

export const signupInitController = async (req, res) => {
  try {
    const { email, password, username } = req.body
    const result = await signupInit(email, password, username)
    
    // Quick DB look up to fetch the unhashed raw code or let signupService handle it
    // Instead of fighting hashes, let's pull the last generated raw one by updating emailService
    res.status(200).json({
      success: true,
      message: result.message,
      DEV_NOTE: "Check your Render logs or update your deployment to get the code."
    })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message,
      code: error.code || 'SERVER_ERROR'
    })
  }
}

export const signupCompleteController = async (req, res) => {
  try {
    const { email, otp, password } = req.body
    const result = await signupComplete(email, otp, password)

    res.status(200).json({
      success: true,
      message: 'Signup completed successfully',
      data: result
    })
  } catch (error) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message,
      code: error.code || 'SERVER_ERROR'
    })
  }
}
