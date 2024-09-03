import type { Description } from '@aeriajs/types'
import type { user as originalUser } from '@aeriajs/builtins'
import { registerStore, useStore } from '@aeria-ui/state-management'
import { reactive } from 'vue'
import { createCollectionStore } from '../state/collection.js'
import { STORAGE_NAMESPACE } from '../constants.js'
import { meta } from './meta.js'
import { Result } from 'aeria-sdk'

type User = {
  _id: string
  name: string
  roles: string[]
}

type SuccessfulAuthentication = {
  token: {
    type: 'bearer'
    content: string
  }
  user: User
}

type Credentials = {
  email: string
  password: string
}

const freshUser = {
  _id: '',
  name: '',
  roles: [],
} satisfies User

export const user = registerStore((context) => {
  const state = reactive({
    currentUser: freshUser as User,
    credentials: {
      email: '',
      password: '',
    },
    description: {} as Omit<Description, 'properties'> & {
      properties: {
        roles: {
          items: {
            enum: string[]
          }
        }
      }
    },
  })

  const auth = localStorage.getItem(`${STORAGE_NAMESPACE}:auth`)
  if( auth ) {
    setCurrentUser(JSON.parse(auth))
  }

  function setCurrentUser(auth: SuccessfulAuthentication | {}) {
    for( const key in state.currentUser ) {
      switch( key ) {
        case 'roles':
          state.currentUser[key] = []
          continue
      }
      delete state.currentUser[key as keyof typeof state.currentUser]
    }

    if( 'user' in auth ) {
      Object.assign(state.currentUser, auth.user)
    }

    localStorage.setItem(`${STORAGE_NAMESPACE}:auth`, JSON.stringify(auth))
  }

  function signout() {
    localStorage.removeItem(`${STORAGE_NAMESPACE}:auth`)
    setCurrentUser({})
  }

  return createCollectionStore({
    $id: 'user',
    state,
    getters: (state) => ({
      properties: () => {
        const metaStore = meta(context)
        const properties = state.description.properties

        properties.roles.items.enum = metaStore.roles
        return properties
      },
      signedIn: () => !!state.currentUser.roles.length,
    }),
    actions: (state) => ({
      setCurrentUser,
      signout,
      async authenticate(payload: Credentials | { revalidate: true }) {
        const store = useStore('user', context.manager)
        const metaStore = meta(context)

        try {
          const { error, result: authResult } = await <ReturnType<typeof originalUser.functions.authenticate>>store.$functions.authenticate(payload)
          if( error ) {
            const errorMessage = error.code
            metaStore.$actions.spawnModal({
              title: 'Erro!',
              body: errorMessage,
            })

            return Result.error(error)
          }

          state.credentials = {
            email: '',
            password: '',
          }

          setCurrentUser(authResult)
          await metaStore.$actions.describe({
            roles: true,
          })

          return Result.result(authResult)

        } catch( err ) {
          signout()
          console.trace(err)
          throw err
        }
      },
      async copyActivationLink(payload: { _id: string }) {
        const store = useStore('user', context.manager)
        const metaStore = meta(context)

        const { error, result } = await <ReturnType<typeof originalUser.functions.getActivationLink>>store.$functions.getActivationLink({
          userId: payload._id,
        })

        if( error ) {
          return metaStore.$actions.spawnToast({
            text: 'Request failed',
            icon: 'warning',
          })
        }

        await navigator.clipboard.writeText(result.url)
        return metaStore.$actions.spawnToast({
          text: 'Link copiado',
          icon: 'info',
        })
      },
    }),
  }, context)

})

