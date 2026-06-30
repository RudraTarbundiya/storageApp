import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => null,
})

export function ThemeProvider({ children, defaultTheme = 'light', ...props }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement

    const applyTheme = (resolvedTheme) => {
      root.classList.remove('light', 'dark')
      root.classList.add(resolvedTheme)
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches ? 'dark' : 'light')

      const handler = (e) => applyTheme(e.matches ? 'dark' : 'light')
      mediaQuery.addEventListener('change', handler)
      localStorage.setItem('theme', theme)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      applyTheme(theme)
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider {...props} value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}