import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import "primeicons/primeicons.css";
import { ToastService } from "primevue";
import { createPinia } from "pinia";
import Noir from "./presets/Noir";
import router from "./composables/router";

const app = createApp(App);
const pinia = createPinia();

app.use(PrimeVue, {
  theme: {
    preset: Noir,
    options: {
      prefix: "p",
      // darkModeSelector: ".p-dark"
    },
  },
});

app.use(pinia);
app.use(ConfirmationService);
app.use(ToastService);
app.use(router);

app.mount("#app");
