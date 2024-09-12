import React from "react"
import { createRoot } from "react-dom/client"
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Settings, Clock, AlertCircle, Archive } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import "./globals.css"

export default function Component() {
  const [activeTab, setActiveTab] = useState('Review')

  const problems = [
    { name: "Two Sum", difficulty: "Easy", status: "Review" },
    { name: "Add Two Numbers", difficulty: "Medium", status: "Scheduled" },
    { name: "Longest Substring Without Repeating Characters", difficulty: "Medium", status: "Archived" },
    { name: "Median of Two Sorted Arrays", difficulty: "Hard", status: "Scheduled" },
    { name: "Reverse Integer", difficulty: "Easy", status: "Review" },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500"
      case "Medium": return "bg-yellow-500"
      case "Hard": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const truncate = (str: string, n: number) => {
    return (str.length > n) ? str.substr(0, n-1) + '...' : str;
  };

  const filteredProblems = problems.filter(problem => problem.status === activeTab)

  return (
    <div className="w-[320px] h-[400px] bg-white p-4 flex flex-col">
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
      
      <div className="flex mb-4 space-x-2">
        {['Review', 'Scheduled', 'Archived'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            className="flex-1 py-1 px-2"
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'Review' && <AlertCircle className="h-4 w-4 mr-1" />}
            {tab === 'Scheduled' && <Clock className="h-4 w-4 mr-1" />}
            {tab === 'Archived' && <Archive className="h-4 w-4 mr-1" />}
            <span className="text-xs">{tab}</span>
          </Button>
        ))}
      </div>
      
      <div className="flex-grow overflow-y-auto">
        <TooltipProvider>
          {filteredProblems.map((problem, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div 
                  className="flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-100 group"
                >
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${getDifficultyColor(problem.difficulty)} mr-2 transition-all duration-200 ease-in-out group-hover:scale-125`}></div>
                    <span className="text-sm text-gray-700 transition-all duration-200 ease-in-out group-hover:translate-x-1">
                      {truncate(problem.name, 20)}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{problem.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
);
