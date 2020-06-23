# cx-vuex-utils
### 为什么要用？

以前维护api 需要设置loading data error 三种状态  写入大量重复代码  

以前维护store 需要registerModule 以及clear 

```javascript

import {
  cloneDeep,
} from 'lodash';

import {
  getDetail,
} from '@/servers';

const initialState = {
  id: null,
  loading: false,
  data: null,
  error: false,
};


export default {
  namespaced: true,
  state: cloneDeep(initialState),
  mutations: {
    LOAD_DATA_LOADING: (state) => {
      state.loading = true;
      state.error = false;
    },
    LOAD_DATA_SUCCESS: (state, data) => {
      state.loading = false;
      state.data = data;
      state.error = false;
    },
    LOAD_DATA_ERROR: (state, error) => {
      state.loading = false;
      state.error = error;
    },
    SET_ID: (state, id) => {
      state.id = id;
    },
    CLEAR: (state) => {
      state = cloneDeep(initialState);
    },
  },
  actions: {
     async init({ dispatch, commit }, {
      id,
    }) {
      commit('SET_ID', id);
      await dispatch('loadData');
    },
    loadData({ commit, getters }) {
      const {
        id,
      } = getters;

      const params = {
        structureId: id,
      };
      return new Promise((resolve, reject) => {
        commit('LOAD_DATA_LOADING');
        getDetail(params).then((data) => {
          commit('LOAD_DATA_SUCCESS', data);
          resolve(data);
        }).catch((error) => {
          commit('LOAD_DATA_ERROR', error);
          reject(error);
        });
      });
    },
    clear({ commit }) {
      commit('CLEAR');
    },
  },
  getters: {
    id(state) {
      return state.id;
    },
    loading(state) {
      return state.loading;
    },
    data(state) {
      return state.data;
    },
    error(state) {
      return state.error;
    },
  },
};

```



```vue
<template>
  <loading v-if="isLoading"></loading>
  <items v-if="!isLoading" :data="data">...</items>
  <error v-if="!isLoading && error" :error="error">...</error>
</template>

<script>
import { createNamespacedHelpers } from 'vuex';
import store from './store';

const NAME = 'detail';
const { mapGetters, mapActions } = createNamespacedHelpers(NAME);

export default {
  name: NAME,
  beforeCreate() {
    if (this.$store.state[NAME] == null) {
      this.$store.registerModule(NAME, store);
    }
  },

  beforeDestroy() {
    this.clear();
  },
  computed: {
    ...mapGetters([
      'loading',
      'data',
      'error',
    ]),
  },
  methods: {
    ...mapActions([
      'init',
      'clear',
    ]),
  },
};
</script>


```



### 安装

```javascript
npm i cx-vuex-utils
```

### 用法

可单独使用 VuexReset

```javascript
import {VuexReset} from 'cx-vuex-utils'

const store = new Vuex.Store({
  plugins: [VuexReset()],
  state: {
    message: 'Welcome!',
    mutations: {
      //需要插入空值以触发
      reset: () => {}
    }
  }
})

store.commit('reset')
```

```javascript
import {VuexReset} from 'cx-vuex-utils'

const store = new Vuex.Store({
  plugins: [VuexReset()],
  state: {
    message: 'Welcome!'
  },
  modules: {
    detail: {
      namespaced: true,
      state: {
        brand: 'Honda'
      },
      mutations: {
        //需要插入空值以触发
        reset: () => {}
      }
    }
  }
})

store.commit('detail/reset')
```

可单独使用VuexApi

```javascript
import {VuexApi} from 'cx-vuex-utils'

//初始化api 名字 唯一
const resourceApiUtil = VuexApi('resourceApi')
 
const state = {
    // {
    //   resourceApi: {
    //     requestStatus: 'not_started',
    //     data: null,
    //     error: null,
    //   }
    // }
    ...resourceApiUtil.state()
}

const mutations = {
    // {
    //     SET_RESOURCE_API: function(state, payload) {...}
    //     SET_RESOURCE_API_REQUEST_STATUS: function(state, payload) {...}
    //     SET_RESOURCE_API_ERROR: function(state, payload) {...}
    //     SET_RESOURCE_API_DATA: function(state, payload) {...}
    // }
    ...resourceApiUtil.mutations(),
}

const actions = {
    async createResource(ctx, payload) {
        const resource = await resourceApiUtil.runAction(
            ctx,
            // 必须是promise!
            () => resourceApi.create(payload)
        )
        // 也可触发其他dispatch
        ctx.dispatch('setResource', resource);
    },
}

const getters = {
    // {
    //     resourceApi: function(state) {...},
    //     isResourceApiNotStarted: function(state) {...},
    //     isResourceApiPending: function(state) {...},
    //     isResourceApiSuccess: function(state) {...},
    //     isResourceApiError: function(state) {...},
    //     resourceApiStatus: function(state) {...},
    //     resourceApiData: function(state) {...},
    //     resourceApiError: function(state) {...},
    // }
    ...resourceApiUtil.getters()
}

export default new Vuex.Store({
  state,
  mutations,
  actions,
  getters
})
```

Mixin 用法 集成了 VuexReset VuexApi

```vue
<script>
import Vuex from 'vuex';
import { Mixin } from 'cx-vuex-utils';
import store from './store';

const NAME = 'detail';
const { mapGetters, mapActions } = Vuex.createNamespacedHelpers(NAME);

const mixin = new Mixin({
  name: NAME, //组件名字 及 store 模块名
  apis: {
   	detail: {
      dispatchType: 'javaApi',
      dispatchRoot: true,
      //... 其他参数 params  dispatch('javaApi', merge(params, payload)， {root: true})
      url: '/detail',
    },
    list: {
      dispatchType: 'javaApi',
      dispatchRoot: true,
      //... 其他参数 params  dispatch('javaApi', params， {root: true})
      url: '/list',
    },
  },
}, store, Vuex);

export default {
  mixins: [mixin],
  computed: {
    ...mapGetters([
      'isDetailPending',
      'detailData',
      'detailError',
      'isListPending',
      'listData',
      'listError',
    ]),
  },
  created(){
    //merge(params, payload)
    this.loadDetail(/* payload */)
  },
  methods: {
    ...mapActions([
      'loadDetail', // `load${'Detail'}`
      'loadList',
      'reset',
    ]),
    handleReset() {
      this.reset();
    },
  },
};
</script>
```

