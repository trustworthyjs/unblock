import axios from 'axios'
import history from '../history'

/**
 * ACTION TYPES
 */
const GET_USER = 'GET_USER'
const REMOVE_USER = 'REMOVE_USER'
const SUBMIT_POPUP = 'SUBMIT_POPUP'

/**
 * INITIAL STATE
 */
const defaultUser = {}

/**
 * ACTION CREATORS
 */
const getUser = user => ({type: GET_USER, user})
const removeUser = () => ({type: REMOVE_USER})

/**
 * THUNK CREATORS
 */
export const me = () =>
  dispatch =>
    axios.get('/auth/me')
      .then(res =>
        dispatch(getUser(res.data || defaultUser)))
      .catch(err => console.log(err))

export const auth = (email, password, method) =>
  dispatch =>
    axios.post(`/auth/${method}`, { email, password })
      .then(res => {
        dispatch(getUser(res.data))
        history.push('/home')
      }, authError => { // rare example: a good use case for parallel (non-catch) error handler
        dispatch(getUser({error: authError}))
      })
      .catch(dispatchOrHistoryErr => console.error(dispatchOrHistoryErr))

export const logout = () =>
  dispatch =>
    axios.post('/auth/logout')
      .then(_ => {
        dispatch(removeUser())
        history.push('/login')
      })
      .catch(err => console.log(err))

export const updateUserTheme = (userId, newTheme) => {
  return dispatch => {
    axios.put(`/api/users/${userId}`, {theme: newTheme})
      .then(res => {
        dispatch(getUser(res.data))
      })
      .catch(err => console.error(err))
    }
}

export const updateUserStreak = (userId, newGoal) =>
  dispatch => {
    let updateObj;
    if (!newGoal) {
      updateObj = {
        streakGoalDate: null,
        currentStreak: 0
      }
    } else {
      updateObj = {
        streakGoalDate: newGoal
      }
    }
    axios.put(`/api/users/${userId}`, updateObj)
      .then(res => {
        dispatch(getUser(res.data))
      })
      .catch(err => console.error(err))
  }

/**
 * REDUCER
 */
export default function (state = defaultUser, action) {
  switch (action.type) {
    case GET_USER:
      return action.user
    case REMOVE_USER:
      return defaultUser
    default:
      return state
  }
}
