import { createRouter, createWebHashHistory } from 'vue-router'
import DefaultLayout from '../layouts/default.vue'
import HomeView from '../views/home/index.vue'


const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: DefaultLayout,
    meta: { title: '首页' },
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'Home',
        component: HomeView,
        meta: {
          title: '首页'
        }
      },
      {
        path: '/settings',
        component: () => import('../views/setting/index.vue'),
        meta: {
          title: '设置'
        }
      },
      {
        path: '/tasks',
        component: () => import('../views/task/index.vue'),
        meta: {
          title: '任务中心'
        }
      },
      {
        path: '/voices',
        component: () => import('../views/voice/index.vue'),
        meta: {
          title: '声音管理'
        }
      },
      {
        path: '/avatars',
        component: () => import('../views/avatar/index.vue'),
        meta: {
          title: '形象管理'
        }
      },
      {
        path: '/accounts',
        component: () => import('../views/account/index.vue'),
        meta: {
          title: '账号管理'
        }
      },
      {
        path: '/materials',
        name: 'MaterialManager',
        component: () => import('../views/material/index.vue'),
        meta: {
          title: '素材管理'
        }
      },
      {
        path: '/materials/upload',
        component: () => import('../views/material/upload.vue'),
        meta: {
          title: '上传素材'
        }
      },
      {
        path: '/profile',
        component: () => import('../views/profile/index.vue'),
        meta: {
          title: '个人资料'
        }
      },
      {
        path: '/member',
        component: () => import('../views/member/index.vue'),
        meta: {
          title: '会员中心'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  // 登录页直接放行
  if (to.name === 'Login') {
    next()
  }

  next()
})

export default router
