import { useState, useEffect } from 'react'

export interface SettingsState {
  backgroundColor: string
  fontFamily: string
  fontSize: number
  fontColor: string
  paddingX: number
  systemFonts: string[]
}

export const useSettings = () => {
  const [settings, setSettings] = useState<SettingsState>({
    backgroundColor: '#f8fafc',
    fontFamily: 'serif',
    fontSize: 30,
    fontColor: '#1e293b',
    paddingX: 48,
    systemFonts: []
  })

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await window.settingsApi.get()
      const fonts = await window.fontsApi.list()

      setSettings({
        backgroundColor: savedSettings.backgroundColor,
        fontFamily: savedSettings.fontFamily,
        fontSize: savedSettings.fontSize,
        fontColor: savedSettings.fontColor,
        paddingX: savedSettings.paddingX,
        systemFonts: fonts
      })
    }
    loadSettings()
  }, [])

  const updateSettings = (updates: Partial<Omit<SettingsState, 'systemFonts'>>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const saveSettings = async () => {
    const { systemFonts, ...toSave } = settings
    await window.settingsApi.set(toSave)
  }

  return {
    settings,
    updateSettings,
    saveSettings
  }
}
