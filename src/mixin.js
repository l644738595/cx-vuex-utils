import { merge, isFunction, upperFirst } from './lib'
import VuexApi from './vuexApi'

export default function(options, store, Vuex) {
  const { createNamespacedHelpers } = Vuex
  const { name, moduleName, apis, getters, actions } = merge(
    { getters: [], actions: [], apis: {} },
    options,
  )

  const newModuleName = moduleName || name

  const { mapGetters, mapActions, mapMutations } = createNamespacedHelpers(
    newModuleName,
  )

  const resourceApis = Object.keys(apis)

  const resourceApisUtil = resourceApis.map(item => VuexApi(item))
  const resourceApisAction = {}

  resourceApis.forEach((item, index) => {
    const { dispatchType, dispatchRoot = true, ...args } = apis[item] || {}
    const actionMidName = upperFirst(item)
    resourceApisAction[`load${actionMidName}`] = async function method(
      ctx,
      payload,
    ) {
      const resource = await resourceApisUtil[index].runAction(ctx, () =>
        ctx.dispatch(dispatchType, merge(args, payload), {
          root: dispatchRoot,
        }),
      )
      return resource
    }
  })

  return {
    name,
    beforeCreate() {
      if (!this.$store.hasModule(newModuleName)) {
        if (isFunction(this.$store.registerModuleState)) {
          this.$store.registerModuleState(
            newModuleName,
            merge(
              {
                state: {
                  ...resourceApisUtil.reduce(
                    (result, item) => ({
                      ...result,
                      ...item.state(),
                    }),
                    {},
                  ),
                },
                getters: {
                  ...resourceApisUtil.reduce(
                    (result, item) => ({
                      ...result,
                      ...item.getters(),
                    }),
                    {},
                  ),
                },
                mutations: {
                  ...resourceApisUtil.reduce(
                    (result, item) => ({
                      ...result,
                      ...item.mutations(),
                    }),
                    {},
                  ),
                  RESET: () => {},
                },
                actions: {
                  ...resourceApisAction,
                  reset: ({ commit }) => {
                    commit('RESET')
                  },
                },
              },
              store,
            ),
          )
        }
      }
    },

    beforeDestroy() {
      if (isFunction(this.$store.unregisterModuleState)) {
        this.$store.unregisterModuleState(newModuleName)
      }
    },

    computed: {
      ...mapGetters(getters),
    },

    methods: {
      ...mapMutations(['reset']),
      ...mapActions([...actions]),
    },
  }
}
