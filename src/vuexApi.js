import Vue from 'vue'

import { toSnakeCase, isFunction, isString, upperFirst, get } from './lib'

const STATUSES = {
  NOT_STARTED: 'not_started',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
}

function makeMutationNames(namespace) {
  const mutationMidName = toSnakeCase(namespace).toUpperCase()

  return {
    SET_FULL_STATE: `SET_${mutationMidName}`,
    SET_REQUEST_STATUS: `SET_${mutationMidName}_REQUEST_STATUS`,
    SET_DATA: `SET_${mutationMidName}_DATA`,
    SET_ERROR: `SET_${mutationMidName}_ERROR`,
  }
}

function makeGetterNames(namespace) {
  const getterMidName = upperFirst(namespace)

  return {
    fullState: namespace,
    isNotStarted: `is${getterMidName}NotStarted`,
    isPending: `is${getterMidName}Pending`,
    isSuccess: `is${getterMidName}Success`,
    isError: `is${getterMidName}Error`,
    requestStatus: `${namespace}Status`,
    data: `${namespace}Data`,
    error: `${namespace}Error`,
  }
}

export default function storeApiHelper(namespace) {
  if (!isString(namespace)) {
    throw new Error('`namespace` parameter must be a string')
  }
  if (!namespace) throw new Error('`namespace` parameter must be valid')

  const mutationNames = makeMutationNames(namespace)
  const getterNames = makeGetterNames(namespace)

  return {
    state() {
      return {
        [namespace]: {
          requestStatus: STATUSES.NOT_STARTED,
          data: null,
          error: null,
        },
      }
    },

    mutations() {
      return {
        [mutationNames.SET_FULL_STATE](state, payload) {
          Vue.set(state, namespace, payload)
        },
        [mutationNames.SET_REQUEST_STATUS](state, payload) {
          Vue.set(state[namespace], 'requestStatus', payload)
        },
        [mutationNames.SET_ERROR](state, payload) {
          Vue.set(state[namespace], 'error', payload)
        },
        [mutationNames.SET_DATA](state, payload) {
          Vue.set(state[namespace], 'data', payload)
        },
      }
    },

    getters() {
      return {
        [getterNames.fullState]: state => get(state, namespace),
        [getterNames.isNotStarted]: state =>
          get(state, [namespace, 'requestStatus']) === STATUSES.NOT_STARTED,
        [getterNames.isPending]: state =>
          get(state, [namespace, 'requestStatus']) === STATUSES.PENDING,
        [getterNames.isSuccess]: state =>
          get(state, [namespace, 'requestStatus']) === STATUSES.SUCCESS,
        [getterNames.isError]: state =>
          get(state, [namespace, 'requestStatus']) === STATUSES.ERROR,
        [getterNames.requestStatus]: state =>
          get(state, [namespace, 'requestStatus']),
        [getterNames.data]: state => get(state, [namespace, 'data']),
        [getterNames.error]: state => get(state, [namespace, 'error']),
      }
    },

    runAction(context, asyncFn) {
      if (!isFunction(asyncFn)) {
        throw new Error('Invalid `asyncFn`; It must be a function.')
      }

      const { commit } = context

      commit(mutationNames.SET_REQUEST_STATUS, STATUSES.PENDING)
      commit(mutationNames.SET_ERROR, null)
      commit(mutationNames.SET_DATA, null)

      return asyncFn()
        .then(response => {
          commit(mutationNames.SET_REQUEST_STATUS, STATUSES.SUCCESS)
          commit(mutationNames.SET_ERROR, null)
          commit(mutationNames.SET_DATA, response || null)

          return response
        })
        .catch(err => {
          commit(mutationNames.SET_REQUEST_STATUS, STATUSES.ERROR)
          commit(mutationNames.SET_ERROR, err || null)
          commit(mutationNames.SET_DATA, null)

          throw err
        })
    },
  }
}
