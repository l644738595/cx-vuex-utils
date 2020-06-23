/* eslint-disable no-param-reassign */
import { clone, merge } from './lib'

export default function VuexReset(opts = {}) {
  const { ssr, trigger } = merge({ trigger: 'RESET' }, opts)

  return store => {
    const initialState = clone(store.state)

    if (ssr) {
      store.replaceState(merge(clone(store.state), clone(ssr)))
    }

    store.subscribe((mutation, state) => {
      if (mutation.type === trigger) {
        const newState = clone(initialState)

        if (state.route) {
          newState.route = clone(state.route)
        }

        store.replaceState(newState)
      } else {
        let mod = mutation.type.split('/')
        const mut = mod.pop()

        if (mut === trigger) {
          mod = mod.join('/')
          store.replaceState({
            ...clone(state),
            [mod]: clone(initialState[mod]),
          })
        }
      }
    })

    store.registerModuleState = (namespace, mod) => {
      store.registerModule(namespace, mod)
      initialState[namespace] = clone(mod.state)
    }

    store.unregisterModuleState = namespace => {
      store.unregisterModule(namespace)
      delete initialState[namespace]
    }
  }
}
