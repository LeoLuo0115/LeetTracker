import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Code, Save, CheckCircle } from 'lucide-react'
// import 'react-toastify/dist/ReactToastify.css'
import { createRoot } from 'react-dom/client'
import "./globals.css"
 

export default function Component() {
  const [user, setUser] = useState({ _id: "" })
  const [formState, setFormState] = useState<"ready" | "saving" | "saved">("ready")
  const [forgettingCurve, setForgettingCurve] = useState("1, 2, 4, 7, 15, 30")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    chrome.storage.sync.get(['user', 'remindSettings'], (result) => {
      if (result.user) {
        setUser(result.user)
      }
      if (result.remindSettings && result.remindSettings.forgettingCurve) {
        setForgettingCurve(result.remindSettings.forgettingCurve.join(", "))
      }
    })
  }, [])

  const submitHandler = async () => {
    setFormState("saving")
    setError(null)

    try {
      if (!user._id.trim()) {
        throw new Error("Invalid user ID")
      }

      const newForgettingCurve = forgettingCurve.split(",").map(day => parseInt(day.trim())).filter(day => !isNaN(day))
      
      await chrome.storage.sync.set({
        user: { _id: user._id },
        remindSettings: { forgettingCurve: newForgettingCurve }
      })

      console.log("Saved settings:", {
        user: { _id: user._id },
        remindSettings: { forgettingCurve: newForgettingCurve }
      })

      setFormState("saved")
      setTimeout(() => setFormState("ready"), 2000)
    } catch (error) {
      console.error(error)
      setError("Failed to save settings. Please try again.")
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
              onChange={(e) => setUser({ ...user, _id: e.target.value })}
              placeholder="Enter your LeetCode username"
              disabled={formState === "saving"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="forgetting-curve">Reminder Days (Forgetting Curve)</Label>
            <Input
              id="forgetting-curve"
              value={forgettingCurve}
              onChange={(e) => setForgettingCurve(e.target.value)}
              placeholder="e.g. 1, 2, 4, 7, 15, 30"
              disabled={formState === "saving"}
            />
            <p className="text-sm text-gray-500">
              Enter the number of days for reminders, separated by commas. These represent the forgetting curve for spaced repetition.
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

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
);
