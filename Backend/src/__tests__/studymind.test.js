import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'

const PW_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/
const JWT_SECRET = 'studymind-dev-secret-change-in-production'

function generarIniciales(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generarToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })
}

// ──────────────────────────────────────────────────────────
// Test Case 1-5: Validación de contraseña (REGEX)
// ──────────────────────────────────────────────────────────
describe('Password validation', () => {
  it('TC1: acepta contraseña válida con mayúscula, minúscula, número y especial', () => {
    expect(PW_REGEX.test('Pass1234!')).toBe(true)
  })

  it('TC2: rechaza contraseña sin mayúscula', () => {
    expect(PW_REGEX.test('pass1234!')).toBe(false)
  })

  it('TC3: rechaza contraseña sin número', () => {
    expect(PW_REGEX.test('Password!')).toBe(false)
  })

  it('TC4: rechaza contraseña sin carácter especial', () => {
    expect(PW_REGEX.test('Pass1234')).toBe(false)
  })

  it('TC5: rechaza contraseña con menos de 8 caracteres', () => {
    expect(PW_REGEX.test('Pa1!a')).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// Test Case 6: Generación de código de verificación
// ──────────────────────────────────────────────────────────
describe('Verification code generation', () => {
  it('TC6: genera un código de 6 dígitos numéricos', () => {
    const code = generarCodigo()
    expect(code).toMatch(/^\d{6}$/)
  })
})

// ──────────────────────────────────────────────────────────
// Test Case 7-8: Generación de iniciales
// ──────────────────────────────────────────────────────────
describe('Initials generation', () => {
  it('TC7: genera "JG" para "Juan García"', () => {
    expect(generarIniciales('Juan García')).toBe('JG')
  })

  it('TC8: genera "J" para nombre sin apellido "Juan" (solo primera letra)', () => {
    expect(generarIniciales('Juan')).toBe('J')
  })
})

// ──────────────────────────────────────────────────────────
// Test Case 9-10: JWT Token
// ──────────────────────────────────────────────────────────
describe('JWT Token', () => {
  it('TC9: genera un token JWT válido con el userId correcto', () => {
    const token = generarToken(42)
    const decoded = jwt.verify(token, JWT_SECRET)
    expect(decoded.userId).toBe(42)
  })

  it('TC10: rechaza un token inválido o alterado', () => {
    expect(() => jwt.verify('token-invalido', JWT_SECRET)).toThrow()
  })
})
