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
  const [forgettingCurve, setForgettingCurve] = useState("1, 2, 4, 7, 15")
  const [forgettingCurveError, setForgettingCurveError] = useState<string | null>(null)
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

  const validateForgettingCurve = (value: string): string | null => {
    // Remove leading and trailing whitespace
    const trimmedValue = value.trim();
    
    // Split by commas and trim each part
    const parts = trimmedValue.split(',').map(part => part.trim());
    
    // Check if there are any empty parts or non-numeric parts
    if (parts.some(part => part === '' || !/^\d+$/.test(part))) {
      return "Invalid input: each entry must be a number.";
    }
    
    const numbers = parts.map(Number);
    if (numbers.length === 0) return "Please enter at least one number.";
    if (numbers.length > 5) return "Please enter no more than 5 numbers.";
    
    let prevNum = 0;
    for (let i = 0; i < numbers.length; i++) {
      const num = numbers[i];
      if (num < 1 || num > 99) return `Number ${num} is out of range (1-99).`;
      if (num <= prevNum) return `Number ${num} should be greater than ${prevNum}.`;
      prevNum = num;
    }
    
    // Check if the trimmed input exactly matches the valid numbers joined by commas
    if (trimmedValue !== numbers.join(', ')) {
      return "Invalid input: extra content detected.";
    }
    
    return null;
  };

  const handleForgettingCurveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForgettingCurve(value);
    
    if (value.trim() === '') {
      setForgettingCurveError(null);
    } else {
      const error = validateForgettingCurve(value);
      setForgettingCurveError(error);
    }
  };

  const submitHandler = async () => {
    setFormState("saving")

    try {
      if (!user._id.trim()) {
        throw new Error("Invalid user ID")
      }

      const error = validateForgettingCurve(forgettingCurve);
      if (error) {
        setForgettingCurveError(error);
        setFormState("ready");
        return;
      }

      const newForgettingCurve = forgettingCurve.split(",").map(day => parseInt(day.trim()))
      
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
      setError(error instanceof Error ? error.message : String(error))
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
              onChange={handleForgettingCurveChange}
              placeholder="e.g. 1, 2, 4, 7, 15"
              disabled={formState === "saving"}
              className={forgettingCurveError ? "border-red-500" : ""}
            />
            {forgettingCurveError && (
              <p className="text-red-500 text-sm">{forgettingCurveError}</p>
            )}
            <p className="text-sm text-gray-500">
              Enter 1-5 numbers (1-99) for reminders, separated by commas. These represent the forgetting curve for spaced repetition.
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
