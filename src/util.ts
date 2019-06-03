const camelizeRE = /-(\w)/g
const fileExtensionRE = /.\w+$/
const literalDotRE = /\./

export function camelize (str: string): string {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
}

export function trimExtension (fileName: string): void {
  fileName.replace(fileExtensionRE, '')
}

export function dotToDash (str: string): void {
  str.replace(literalDotRE, '-')
}