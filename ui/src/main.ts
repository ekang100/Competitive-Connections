import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import App from './App.vue'
import Game from './views/Game.vue'
import End from './views/End.vue'

const routes = [
	{
		path: "/:playerIndex",
		component: Game,
		// props (route) {
		// 	return {
		// 		playerIndex: route.params.playerIndex
		// 	}
		// }
	},
	   {
        path: "/game-over",
        component: End, // Define the End component for /game-over route
    }
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
