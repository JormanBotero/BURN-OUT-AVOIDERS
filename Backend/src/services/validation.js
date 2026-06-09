export const PW_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/

export function generarIniciales(name) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

export function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
