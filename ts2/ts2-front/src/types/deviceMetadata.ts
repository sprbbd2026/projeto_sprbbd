/**
 * Metadados do dispositivo coletados automaticamente no front-end.
 **/
export type DeviceMetadata = {
  /* navigator.userAgent completo */
  userAgent: string
  /* Nome e versão do navegador */
  browser: string
  /* Sistema operacional */
  os: string
  /* Tipo de dispositivo detectado */
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  /* Idioma principal do navegador */
  language: string
  /* Fuso-horário */
  timezone: string
}
