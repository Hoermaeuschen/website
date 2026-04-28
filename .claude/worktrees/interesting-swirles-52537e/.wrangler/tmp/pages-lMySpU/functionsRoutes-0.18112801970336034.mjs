import { onRequestGet as __api_auth_callback_js_onRequestGet } from "/mnt/f/Obsidian/JJ-Private/Hörmäuschen/Website/functions/api/auth/callback.js"
import { onRequestGet as __api_auth_js_onRequestGet } from "/mnt/f/Obsidian/JJ-Private/Hörmäuschen/Website/functions/api/auth.js"

export const routes = [
    {
      routePath: "/api/auth/callback",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_callback_js_onRequestGet],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_js_onRequestGet],
    },
  ]