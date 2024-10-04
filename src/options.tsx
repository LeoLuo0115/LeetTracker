import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Code, Save, CheckCircle } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import "./globals.css"

type FormState = "ready" | "saving" | "saved"

interface User {
  _id: string
}

interface RemindSettings {
  forgettingCurve: number[]
}

export const FORGETTING_CURVE_LENGTH = 5
const MIN_DAY = 1
const MAX_DAY = 99

export default function Component() {
  const [user, setUser] = useState<User>({ _id: "" })
  const [formState, setFormState] = useState<FormState>("ready")
  const [forgettingCurve, setForgettingCurve] = useState("1, 2, 4, 7, 15")
  const [forgettingCurveError, setForgettingCurveError] = useState<string | null>(null)
  const [userIdError, setUserIdError] = useState<string | null>(null);

  useEffect(() => {
    chrome.storage.sync.get(['user', 'remindSettings'], (result) => {
      if (result.user) {
        setUser(result.user)
      }
      if (result.remindSettings?.forgettingCurve) {
        setForgettingCurve(result.remindSettings.forgettingCurve.join(", "))
      }
    })
  }, [])

  const validateForgettingCurve = (value: string): string | null => {
    const trimmedValue = value.trim()
    const parts = trimmedValue.split(',').map(part => part.trim())
    
    if (parts.length !== FORGETTING_CURVE_LENGTH) {
      return `Please enter exactly ${FORGETTING_CURVE_LENGTH} numbers.`
    }

    const numbers = parts.map(Number)
    
    for (let i = 0; i < numbers.length; i++) {
      if (isNaN(numbers[i])) {
        return `Invalid input: "${parts[i]}" is not a number.`
      }
      if (!Number.isInteger(numbers[i])) {
        return `Invalid input: "${parts[i]}" is not an integer.`
      }
      if (numbers[i] < MIN_DAY || numbers[i] > MAX_DAY) {
        return `Number ${numbers[i]} is out of range (${MIN_DAY}-${MAX_DAY}).`
      }
      if (i > 0 && numbers[i] <= numbers[i - 1]) {
        return `Number ${numbers[i]} should be greater than ${numbers[i - 1]}.`
      }
    }

    if (trimmedValue !== numbers.join(', ')) {
      return "Invalid input: please use comma-separated integers only."
    }

    return null
  }

  const handleForgettingCurveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForgettingCurve(value)
    setForgettingCurveError(value.trim() ? validateForgettingCurve(value) : null)
  }

  const submitHandler = async () => {
    setFormState("saving")
    setForgettingCurveError(null)
    setUserIdError(null)

    if (!user._id.trim()) {
      setUserIdError("Invalid user ID")
      setFormState("ready")
      return
    }

    const curveError = validateForgettingCurve(forgettingCurve)
    if (curveError) {
      setForgettingCurveError(curveError)
      setFormState("ready")
      return
    }

    const newForgettingCurve = forgettingCurve.split(",").map(day => parseInt(day.trim()))
    
    try {
      await chrome.storage.sync.set({
        user: { _id: user._id },
        remindSettings: { forgettingCurve: newForgettingCurve } as RemindSettings
      })
      
      // sync to local storage
      await chrome.storage.local.set({
        user: { _id: user._id },
        remindSettings: { forgettingCurve: newForgettingCurve } as RemindSettings
      })

      console.log("Saved settings:", { user: { _id: user._id }, remindSettings: { forgettingCurve: newForgettingCurve } })

      setFormState("saved")
      setTimeout(() => setFormState("ready"), 2000)
    } catch (error) {
      console.error(error)
      setUserIdError(error instanceof Error ? error.message : String(error))
      setFormState("ready")
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col p-8">
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center mb-8"
      >
        <Code className="text-[#FFA116] w-8 h-8 mr-2" />
        <h1 className="text-3xl font-bold text-gray-800">LeetCode Tracker Options</h1>
      </motion.header>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Configure Your Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="leetcode-username">LeetCode Username</Label>
            <Input
              id="leetcode-username"
              value={user._id}
              onChange={(e) => setUser({ _id: e.target.value })}
              placeholder="Enter your LeetCode username"
              disabled={formState === "saving"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="forgetting-curve">Reminder Days (Forgetting Curve)</Label>
            <Input
              id="forgetting-curve"
              value={forgettingCurve}
              onChange={handleForgettingCurveChange}
              placeholder={`e.g. 1, 2, 4, 7, 15 (${MIN_DAY}-${MAX_DAY})`}
              disabled={formState === "saving"}
              className={forgettingCurveError ? "border-red-500" : ""}
            />
            {forgettingCurveError && (
              <p className="text-red-500 text-sm">{forgettingCurveError}</p>
            )}
            <p className="text-sm text-gray-500">
              Enter {FORGETTING_CURVE_LENGTH} increasing integers ({MIN_DAY}-{MAX_DAY}) for reminders, separated by commas.
              These intervals define when you'll review problems for optimal long-term retention.
            </p>
          </div>

          <Button 
            onClick={submitHandler} 
            disabled={formState === "saving"}
            className="w-full bg-[#FFA116] hover:bg-[#FFB84D] text-white relative"
          >
            {formState === "saving" ? (
              "Saving..."
            ) : formState === "saved" ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>

          {userIdError && (
            <p className="text-red-500 text-sm mt-2">{userIdError}</p>
          )}

        </CardContent>
      </Card>
    </div>
  )
}

const root = createRoot(document.getElementById("root")!)

root.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
)