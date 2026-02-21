import { useState, useEffect } from 'react'

export interface SettingsState {
  backgroundColor: string
  fontFamily: string
  fontSize: number
  fontColor: string
  paddingX: number
  paddingY: number
  headerFontSize: number
  headerPaddingY: number
  headerAlign: 'left' | 'center' | 'right'
  systemFonts: string[]
}

// Preload에서 동기적으로 로드한 설정을 초기값으로 사용
const getInitialSettings = (): SettingsState => {
  const saved = window.settingsApi.getInitial()
  return {
    backgroundColor: saved.backgroundColor,
    fontFamily: saved.fontFamily,
    fontSize: saved.fontSize,
    fontColor: saved.fontColor,
    paddingX: saved.paddingX,
    paddingY: saved.paddingY ?? 0,
    headerFontSize: saved.headerFontSize ?? 14,
    headerPaddingY: saved.headerPaddingY ?? 16,
    headerAlign: saved.headerAlign ?? 'center',
    systemFonts: []
  }
}

export const useSettings = () => {
  const [settings, setSettings] = useState<SettingsState>(getInitialSettings)

  // 시스템 폰트 목록만 비동기로 로드
  useEffect(() => {
    const loadFonts = async () => {
      const fonts = await window.fontsApi.list()
      setSettings(prev => ({ ...prev, systemFonts: fonts }))
    }
    loadFonts()
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
