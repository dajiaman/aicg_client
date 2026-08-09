import { createApp } from 'vue'
import './styles/tailwind.css'

import Antd from 'ant-design-vue'
import './styles/global.css'

import 'ant-design-vue/dist/reset.css'

import VueKonva from 'vue-konva'
import router from './router'
import App from './App.vue'
import store from './store/index.js'

const app = createApp(App)
app.use(VueKonva)
app.use(store)

// size 由 app.use 注册；主题由 ConfigProvider 注入（darkTheme）
app.use(Antd, { size: 'medium' })
app.use(router)

app.mount('#app')
