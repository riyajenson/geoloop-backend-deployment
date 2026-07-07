import supabase from '../config/supabase.js'
import { AuthAppError } from '../utils/authErrors.js'

const LOGIN_BONUS_COINS = 10
const DAILY_LOGIN_LIMIT = 1

export async function addCoinsOnLogin(userId) {
  try {
    const { data: stats, error: fetchError } = await supabase
      .from('user_stats')
      .select('coins')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      throw new AuthAppError('Failed to fetch user stats', 500, 'FETCH_ERROR')
    }

    const { data: updatedStats, error: updateError } = await supabase
      .from('user_stats')
      .update({
        coins: (stats.coins || 0) + LOGIN_BONUS_COINS,
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      throw new AuthAppError('Failed to update coins', 500, 'UPDATE_ERROR')
    }

    return {
      coinsAdded: LOGIN_BONUS_COINS,
      totalCoins: updatedStats.coins,
    }
  } catch (error) {
    if (error instanceof AuthAppError) {
      throw error
    }
    throw new AuthAppError('Coin reward failed', 500, 'COIN_REWARD_FAILED')
  }
}

export async function addCoins(userId, amount) {
  try {
    const { data: newCoinCount, error: rpcError } = await supabase.rpc('increment_coins', {
      user_id: userId,
      amount: amount
    })

    if (rpcError) {
      throw new AuthAppError('Failed to add coins via database RPC', 500, 'ADD_COINS_ERROR')
    }

    const { data: updatedStats, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      throw new AuthAppError('Failed to retrieve updated stats row', 500, 'ADD_COINS_ERROR')
    }

    return updatedStats
  } catch (error) {
    if (error instanceof AuthAppError) {
      throw error
    }
    throw new AuthAppError('Add coins failed', 500, 'ADD_COINS_FAILED')
  }
}

export async function deductCoins(userId, amount) {
  try {
    if (amount <= 0) {
      throw new AuthAppError('Amount must be positive', 400, 'INVALID_AMOUNT')
    }

    const { data: stats, error: fetchError } = await supabase
      .from('user_stats')
      .select('coins')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      throw new AuthAppError('Failed to fetch user coins', 500, 'FETCH_ERROR')
    }

    if (stats.coins < amount) {
      throw new AuthAppError(
        'Insufficient coins',
        400,
        'INSUFFICIENT_COINS'
      )
    }

    const { data: updatedStats, error: updateError } = await supabase
      .from('user_stats')
      .update({
        coins: stats.coins - amount,
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      throw new AuthAppError('Failed to deduct coins', 500, 'DEDUCT_ERROR')
    }

    return updatedStats
  } catch (error) {
    if (error instanceof AuthAppError) {
      throw error
    }
    throw new AuthAppError('Deduct coins failed', 500, 'DEDUCT_COINS_FAILED')
  }
}

export async function getUserCoins(userId) {
  try {
    const { data, error } = await supabase
      .from('user_stats')
      .select('coins')
      .eq('user_id', userId)
      .single()

    if (error) {
      throw new AuthAppError('Failed to fetch coins', 500, 'FETCH_ERROR')
    }

    return data.coins
  } catch (error) {
    if (error instanceof AuthAppError) {
      throw error
    }
    throw new AuthAppError('Get coins failed', 500, 'GET_COINS_FAILED')
  }
}
