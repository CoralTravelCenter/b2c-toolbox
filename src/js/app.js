import { asap, hostReactAppReady } from "../lib/usefuls";
import { createApp } from "vue";
import ToolBox from "../components/ToolBox.vue";
import ElementPlus from 'element-plus';

asap(async () => {
    await hostReactAppReady();
    createApp(ToolBox).use(ElementPlus, { locale: ElementPlusLocaleRu }).mount('#toolbox-app');
});