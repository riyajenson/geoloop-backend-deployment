import * as profileService from '../services/profileService.js'

export async function getProfile(req, res) {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      })
    }

    const profile = await profileService.getProfileById(id)

    return res.status(200).json({
      success: true,
      data: profile,
    })
  } catch (error) {
    return res.status(error.code === 'PGRST116' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch profile',
      code: error.code || 'PROFILE_FETCH_ERROR',
    })
  }
}

export async function updateProfile(req, res) {
  try {
    const { id } = req.params
    const updates = req.body

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      })
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided',
      })
    }

    const updatedProfile = await profileService.updateProfileById(id, updates)

    return res.status(200).json({
      success: true,
      data: updatedProfile,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
      code: error.code || 'PROFILE_UPDATE_ERROR',
    })
  }
}
