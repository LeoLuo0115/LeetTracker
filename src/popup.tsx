import React, { useEffect, useState, useCallback, useRef } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { VariableSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { Settings, Clock, AlertCircle, Archive, Search, Filter, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import "./globals.css"
import { Problem, getProblemStatus } from './lib/problem-manager'

const difficultyColors = {
  Easy: "text-green-500",
  Medium: "text-yellow-500",
  Hard: "text-red-500"
}

const proficiencyGradients = [
  "from-red-400 to-red-600",
  "from-orange-400 to-orange-600",
  "from-yellow-400 to-yellow-600",
  "from-green-400 to-green-600",
  "from-blue-400 to-blue-600"
]

interface GradientProgressBarProps {
  proficiency: number
  className?: string
}

function GradientProgressBar({ proficiency, className }: GradientProgressBarProps) {
  return (
    <div className={cn("w-24 h-2 bg-gray-200 rounded-full overflow-hidden", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r",
          proficiencyGradients[proficiency - 1]
        )}
        style={{ width: `${(proficiency / 5) * 100}%` }}
      />
    </div>
  )
}

export default function Component() {
  const [activeTab, setActiveTab] = useState<string>('Review')
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState<'id' | 'difficulty' | 'title' | 'proficiency'>('id')
  const [expandedProblems, setExpandedProblems] = useState<{[key: string]: boolean}>({})
  const listRef = useRef<List>(null)

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    const result = await chrome.storage.local.get(null)
    const storedProblems = Object.entries(result)
      .filter(([key, value]) => !isNaN(Number(key)))
      .map(([_, value]) => value as Problem)
    setProblems(storedProblems)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  const openProblemPage = (url: string) => {
    chrome.tabs.create({ url })
  }

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage()
  }

  const sortProblems = (problems: Problem[]) => {
    return problems.sort((a, b) => {
      switch (sortOption) {
        case 'id':
          return Number(a.id) - Number(b.id)
        case 'difficulty':
          const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 }
          return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - difficultyOrder[b.difficulty as keyof typeof difficultyOrder]
        case 'title':
          return a.title.localeCompare(b.title)
        case 'proficiency':
          return b.proficiency - a.proficiency
        default:
          return 0
      }
    })
  }

  const filteredProblems = sortProblems(
    problems
      .filter(problem => getProblemStatus(problem) === activeTab)
      .filter(problem => 
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.id.toString().includes(searchTerm)
      )
  )

  const toggleProblemExpansion = (problemId: string) => {
    setExpandedProblems(prev => {
      const newExpanded = { ...prev, [problemId]: !prev[problemId] }
      if (listRef.current) {
        listRef.current.resetAfterIndex(0)
      }
      return newExpanded
    })
  }

  const getItemSize = (index: number) => {
    const problem = filteredProblems[index]
    return expandedProblems[problem.id] ? 150 : 50
  }

  const ProblemItem = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const problem = filteredProblems[index]
    const isExpanded = expandedProblems[problem.id] || false

    return (
      <div 
        style={style}
        className={cn(
          "p-4 rounded-lg transition-all duration-300 ease-in-out",
          isExpanded ? "bg-gray-50 shadow-sm" : "bg-white hover:bg-gray-50"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-grow">
            <span className={cn("text-sm font-semibold", difficultyColors[problem.difficulty as keyof typeof difficultyColors])}>
              {problem.id}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span 
                  className="text-sm font-medium text-gray-700 cursor-pointer hover:underline line-clamp-1 flex-grow"
                  onClick={() => openProblemPage(problem.url)}
                >
                  {problem.title}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{problem.title}</p>
                <p className="text-xs text-gray-500">{`Difficulty: ${problem.difficulty}`}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center space-x-4">
            <GradientProgressBar proficiency={problem.proficiency} />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => toggleProblemExpansion(problem.id)}
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "transform rotate-180")} />
            </Button>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-4 flex justify-end space-x-2 animate-fadeIn">
            <Button size="sm" variant="outline" onClick={() => openProblemPage(problem.url)}>
              Open Problem
            </Button>
            <Button size="sm" variant="outline" onClick={() => {/* Implement archive functionality */}}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="w-[480px] h-[600px] bg-white p-6 flex flex-col">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">LeetTracker</h1>
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="transition-all duration-200 ease-in-out hover:bg-gray-100"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortOption('id')}>
                  Sort by ID
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('difficulty')}>
                  Sort by Difficulty
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('title')}>
                  Sort by Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('proficiency')}>
                  Sort by Proficiency
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              size="icon" 
              className="transition-all duration-200 ease-in-out hover:bg-gray-100 hover:rotate-45"
              onClick={openOptionsPage}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </header>
        
        <div className="flex mb-6 space-x-3">
          {['Review', 'Scheduled', 'Archived'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              className="flex-1 py-2 px-3"
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'Review' && <AlertCircle className="h-4 w-4 mr-2" />}
              {tab === 'Scheduled' && <Clock className="h-4 w-4 mr-2" />}
              {tab === 'Archived' && <Archive className="h-4 w-4 mr-2" />}
              <span>{tab}</span>
            </Button>
          ))}
        </div>

        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search problems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        
        <div className="flex-grow">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading...</p>
            </div>
          ) : (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  className="custom-scrollbar"
                  height={height}
                  itemCount={filteredProblems.length}
                  itemSize={getItemSize}
                  width={width}
                  overscanCount={5}
                  ref={listRef}
                >
                  {ProblemItem}
                </List>
              )}
            </AutoSizer>
          )}
        </div>
        {filteredProblems.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

const root = createRoot(document.getElementById("root")!)

root.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
)
