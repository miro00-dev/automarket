import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const pageNames = [
  'cars',
  'car-details',
  'login',
  'register',
  'add-car',
  'my-listings',
  'favorites',
  'admin',
]

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        ...Object.fromEntries(
          pageNames.map((pageName) => [pageName, resolve(import.meta.dirname, `pages/${pageName}.html`)]),
        ),
      },
    },
  },
})
