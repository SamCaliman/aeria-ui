import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

export const userRoutes = (component: Component | (()=> Promise<Component>), children: RouteRecordRaw[] = []): RouteRecordRaw => ({
  path: '/user',
  name: '/builtin:user',
  component,
  children: children.concat([
    {
      path: 'invite/:id',
      name: '/user/invite/:id',
      redirect: (to) => {
        return {
          path: '/user/signup',
          params: {
            inviteId: to.params.id,
          },
        }
      },
    },
    {
      path: 'signin',
      name: '/user/signin',
      component: () => import('./views/user/signin.vue'),
      meta: {
        title: 'Sign in',
      },
    },
    {
      path: 'signup',
      name: '/user/signup',
      component: () => import('./views/user/signup.vue'),
      meta: {
        title: 'Sign up',
      },
    },
    {
      path: 'redefine-password',
      name: '/user/redefine-password',
      component: () => import('./views/user/redefine-password.vue'),
      meta: {
        title: 'Redefine password',
      },
    },
    {
      path: 'activation',
      name: '/user/activation',
      component: () => import('./views/user/activation.vue'),
      meta: {
        title: 'Activate user',
      },
    },
  ]),
})

export const dashboardRoutes = (component: Component | (()=> Promise<Component>), children: RouteRecordRaw[] = []): RouteRecordRaw => ({
  path: '/dashboard',
  name: '/builtin:dashboard',
  component,
  redirect: {
    name: '/dashboard/',
  },
  meta: {
    title: 'Dashboard',
  },
  children: children.concat([
    {
      path: 'c/:collection',
      name: '/dashboard/:collection',
      props: true,
      components: {
        default: () => import('./views/dashboard/[collection]/index.vue'),
        topbar: () => import('./components/dashboard/aeria-crud-topbar/aeria-crud-topbar.vue'),
      },
      meta: {
        title: '%viewTitle%',
      },
    },
    {
      path: 'c/:collection/:id/:section?',
      name: '/dashboard/:collection/:id',
      props: true,
      components: {
        default: () => import('./views/dashboard/[collection]/[id].vue'),
      },
      meta: {
        title: '%viewTitle%',
      },
    },
    {
      path: 'user',
      name: '/dashboard/user',
      meta: {
        title: 'user',
        icon: 'users',
        collection: 'user',
      },
      redirect: '/dashboard/c/user',
      children: [
        {
          path: 'profile',
          component: () => import('./views/dashboard/user/profile/index.vue'),
          meta: {
            title: 'User profile',
            icon: 'user-square',
          },
        },
        {
          path: 'changepass',
          name: '/dashboard/user/changepass',
          component: () => import('./views/dashboard/user/password-change/index.vue'),
          meta: {
            title: 'Change password',
            icon: 'lock',
          },
        },
      ],
    },
  ]),
})

