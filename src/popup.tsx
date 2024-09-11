import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createRoot } from "react-dom/client";
import { PlusCircle, Search, Settings, CheckCircle2, XCircle, Circle } from "lucide-react"
import "./globals.css"

export default function Component() {
  const problems = [
    { name: "Two Sum", difficulty: "Easy", status: "Reviewed" },
    { name: "Add Two Numbers", difficulty: "Medium", status: "To Review" },
    { name: "Longest Substring", difficulty: "Medium", status: "In Progress" },
    { name: "Median of Two Sorted Arrays", difficulty: "Hard", status: "To Review" },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500"
      case "Medium": return "bg-yellow-500"
      case "Hard": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Reviewed": return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "To Review": return <XCircle className="h-4 w-4 text-red-500" />
      case "In Progress": return <Circle className="h-4 w-4 text-yellow-500" />
      default: return null
    }
  }

  return (
    <div className="w-[300px] h-[400px] bg-white p-4 flex flex-col">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">LeetTracker</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="transition-all duration-200 ease-in-out hover:bg-gray-100 hover:rotate-45"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </header>
      
      <div className="relative mb-4">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input 
          type="search" 
          placeholder="Search problems..." 
          className="pl-8 bg-gray-100 border-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-blue-500 hover:bg-gray-200"
        />
      </div>
      
      <div className="flex-grow overflow-y-auto">
        {problems.map((problem, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-100 group"
          >
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${getDifficultyColor(problem.difficulty)} mr-2 transition-all duration-200 ease-in-out group-hover:scale-125`}></div>
              <span className="text-sm text-gray-700 transition-all duration-200 ease-in-out group-hover:translate-x-1">{problem.name}</span>
            </div>
            <div className="transition-all duration-200 ease-in-out group-hover:scale-110">
              {getStatusIcon(problem.status)}
            </div>
          </div>
        ))}
      </div>
      
      <Button 
        className="mt-4 w-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 ease-in-out hover:shadow-md group"
      >
        <PlusCircle className="h-4 w-4 mr-2 transition-all duration-200 ease-in-out group-hover:rotate-90" />
        <span className="transition-all duration-200 ease-in-out group-hover:translate-x-1">Add Problem</span>
      </Button>
    </div>
  )
}


const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
);
