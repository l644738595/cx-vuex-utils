/* eslint-disable no-continue */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/**
 * Is this a function or not?
 * @param {*} fn
 */
export const isFunction = fn =>
  fn && {}.toString.call(fn) === '[object Function]'

/**
 * Mimics lodash's get method functionality
 *
 * @param {*} obj
 * @param {*} path
 * @param {*} defaultValue
 */
export const get = (obj, path, defaultValue) => {
  const travel = regexp =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce(
        (res, key) => (res !== null && res !== undefined ? res[key] : res),
        obj,
      )
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)
  return result === undefined || result === obj ? defaultValue : result
}

/**
 * Checks if passed in param is a string
 * @param {*} str
 */
export const isString = str => {
  if (str && typeof str.valueOf() === 'string') {
    return true
  }
  return false
}

/**
 * Convert string to snake_case
 * @param {*} str
 */
export const toSnakeCase = str => {
  if (!isString(str)) return str

  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.toLowerCase())
    .join('_')
}

/**
 * 'hello' => 'Hello'
 * @param {*} str
 */
export const upperFirst = str => {
  if (!isString(str)) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const clone = src => {
  // Null/undefined/functions/etc
  if (!src || typeof src !== 'object' || typeof src === 'function') {
    return src
  }

  // DOM Node
  if (src.nodeType && 'cloneNode' in src) {
    return src.cloneNode(true)
  }

  // Date
  if (src instanceof Date) {
    return new Date(src.getTime())
  }

  // RegExp
  if (src instanceof RegExp) {
    return new RegExp(src)
  }

  // Arrays
  if (Array.isArray(src)) {
    return src.map(clone)
  }

  // ES6 Maps
  if (src instanceof Map) {
    return new Map(Array.from(src.entries()).map(([k, v]) => [k, clone(v)]))
  }

  // ES6 Sets
  if (src instanceof Set) {
    return new Set(Array.from(src.values()).map(clone))
  }

  // Object
  if (src instanceof Object) {
    const destination = {}
    const circulars = (this && this.circulars) || []
    circulars.push(src)
    for (const key in src) {
      if (circulars.includes(src[key])) {
        continue
      } else if (typeof src[key] === 'object') {
        destination[key] = clone.call({ circulars }, src[key])
      } else {
        destination[key] = clone(src[key])
      }
    }
    return destination
  }
  return src
}

export const isObject = i => typeof i === 'object' && i && !Array.isArray(i)

export const merge = (...items) => {
  const circulars = (this && this.circulars) || []
  const destination = items.shift()
  for (const item of items) {
    circulars.push(item)
    if (isObject(item)) {
      for (const key in item) {
        const val = item[key]
        const to = destination[key]
        if (circulars.includes(val)) {
          continue
        } else if (isObject(val)) {
          destination[key] = merge.call(
            { circulars },
            isObject(to) ? to : {},
            val,
          )
        } else if (val !== undefined) {
          destination[key] = val
        }
      }
    }
  }
  return destination
}
