import { load as loadModel } from '@nsfw-filter/nsfwjs'
import { enableProdMode } from '@tensorflow/tfjs'
import { createStore } from 'redux'

import { SettingsActionTypes } from '../popup/redux/actions/settings'
import { StatisticsActionTypes } from '../popup/redux/actions/statistics'
import { createChromeStore } from '../popup/redux/chrome-storage'
import { rootReducer, RootState } from '../popup/redux/reducers'
import { ILogger, Logger } from '../utils/Logger'
import { PredictionRequest, PredictionResponse } from '../utils/messages'

import { Model, ModelSettings } from './Model/Model'
import { PredictionQueue } from './PredictionQueue/PredictionQueue'

export type IReduxedStorage = {
  getState: () => RootState
  dispatch: (action: SettingsActionTypes | StatisticsActionTypes) => void // returns dispatchedAction
}

export type loadType = {
  logger: ILogger
  store: IReduxedStorage
  modelSettings: ModelSettings
}

enableProdMode()
let attempts = 0

const load = ({ logger, store, modelSettings }: loadType): void => {
  const MODEL_PATH = '../models/'

  // @ts-expect-error
  loadModel(MODEL_PATH, { type: 'graph' })
    .then(NSFWJSModel => {
      const model = new Model(NSFWJSModel, logger, modelSettings)
      const pQueue = new PredictionQueue(model, logger, store)

      // Event when content sends request to filter image
      chrome.runtime.onMessage.addListener((request: PredictionRequest, sender, callback: (value: PredictionResponse) => void) => {
        if (request.type === 'SIGN_CONNECT') return

        const { url } = request
        pQueue.predict(url, sender.tab?.id)
          .then(result => callback(new PredictionResponse(result, url)))
          .catch(err => callback(new PredictionResponse(false, url, err.message)))

        return true // https://stackoverflow.com/a/56483156
      })

      // Close tab window event
      chrome.tabs.onRemoved.addListener(tabId => pQueue.clearByTabId(tabId))

      // Close popup window event
      chrome.runtime.onConnect.addListener(port => port.onDisconnect.addListener(() => {
        const { logging, filterStrictness, concurrency } = store.getState().settings

        logging ? logger.enable() : logger.disable()
        pQueue.setSettings({ concurrency: Number(concurrency) })
        model.setSettings({ filterStrictness })
      }))
    })
    .catch(error => {
      logger.error(error)
      if (attempts < 5) setTimeout(load, 200)

      logger.log(`Reload model, attempt: ${attempts}`)
    })
}

const init = async (): Promise<void> => {
  attempts++
  const store = await createChromeStore({ createStore })(rootReducer)
  const { logging, filterStrictness } = store.getState().settings

  const logger = new Logger()
  if (logging === true) logger.enable()

  load({ logger, store, modelSettings: { filterStrictness } })
}

init()
