import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App).use(createPinia()).use(router)

// Attendre la résolution de la navigation initiale avant de monter : sur un
// rechargement direct d'une route profonde (/stats, /reglages…), `route.path`
// ne devient stable qu'après coup sinon, ce qui déclenche deux fois
// l'animation d'entrée (App.vue) et fige les éléments à faible opacité.
router.isReady().then(() => app.mount('#app'))
