import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import App from './App.vue'
import Game from './views/Game.vue'
import Start from './views/Start.vue'
import End from './views/End.vue'
import StartAdmin from './views/StartAdmin.vue'

const routes = [
	{
		path: "/:playerIndex",
		component: Game,
		props (route:any) {
			return {
				playerIndex: route.params.playerIndex
			}
		}
	},
	{
		path: "/",
		component: Start,
	},
	{
		path: "/admin",
		component: StartAdmin,
	},
	{
		path: "/game-over",
		component: End,
	},
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

createApp(App)
	.use(BootstrapVue as any)
	.use(BootstrapVueIcons as any)
	.use(router)
	.mount('#app')
