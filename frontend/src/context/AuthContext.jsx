"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("http://localhost:4000/user/profile", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        console.log('data')
        // backend returns { name, email } (not nested under `user`)
        setUser(data)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await fetch("http://localhost:4000/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }
    const data = await response.json()
    // Fetch profile to populate user context
    await checkAuth()
    return data
  }

  const register = async (name, email, password, otp) => {
    const response = await fetch("http://localhost:4000/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, otp }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }
    return response.json()
  }

  const sendOtp = async (email) => {
    const response = await fetch("http://localhost:4000/user/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }
    return response.json()
  }

  const logout = async () => {
    await fetch("http://localhost:4000/user/logout", {
      method: "POST",
      credentials: "include",
    })
    setUser(null)
  }

  const logoutAll = async () => {
    await fetch("http://localhost:4000/user/logoutall", {
      method: "POST",
      credentials: "include",
    })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, sendOtp, logout, logoutAll }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
