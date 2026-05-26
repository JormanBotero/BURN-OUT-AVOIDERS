// vitest.config.js — raíz del proyecto Backend/
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Usa el entorno Node (sin DOM), ideal para APIs Express
    environment: 'node',

    // Variables de entorno disponibles en todos los tests
    env: {
      JWT_SECRET: 'test-secret-para-vitest',
      NODE_ENV: 'test',
    },

    // Muestra cada test individual en la consola
    reporter: 'verbose',

    // Cobertura de código (ejecutar con: npm run test:coverage)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/models/database.js'], // la BD real se mockea
    },
  },
})
