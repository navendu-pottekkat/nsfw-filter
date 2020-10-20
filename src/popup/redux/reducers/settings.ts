
import { SettingsActionTypes } from '../actions/settings'
import {
  TOGGLE_LOGGING,
  TOGGLE_DIV_FILTERING,
  SET_FILTER_EFFECT,
  SET_TRAINED_MODEL,
  SET_FILTER_STRICTNESS
} from '../actions/settings/settingsTypes'

export type SettingsState = {
  logging: boolean
  filteringDiv: boolean
  filterEffect: 'hide' | 'blur'
  trainedModel: 'mobile_v1.1'
  filterStrictness: number
}

const initialState: SettingsState = {
  logging: false,
  filteringDiv: false,
  filterEffect: 'hide',
  trainedModel: 'mobile_v1.1',
  filterStrictness: 90
}

export function settings (state = initialState, action: SettingsActionTypes): SettingsState {
  switch (action.type) {
    case TOGGLE_LOGGING:
      return { ...state, logging: !state.logging }
    case TOGGLE_DIV_FILTERING:
      return { ...state, filteringDiv: !state.filteringDiv }
    case SET_FILTER_EFFECT:
      return { ...state, filterEffect: action.payload.filterEffect }
    case SET_TRAINED_MODEL:
      return { ...state, trainedModel: action.payload.trainedModel }
    case SET_FILTER_STRICTNESS:
      return { ...state, filterStrictness: action.payload.filterStrictness }
    default:
      return state
  }
}
