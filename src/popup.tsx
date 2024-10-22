import React, { useEffect, useState, useCallback } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Settings, Clock, AlertCircle, Archive, Search, Filter } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import "./globals.css"
import { Problem, getProblemStatus } from './lib/problem-manager'

export default function Component() {
  const [activeTab, setActiveTab] = useState<string>('Review')
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState<'id' | 'difficulty' | 'title' | 'proficiency'>('id')

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500"
      case "Medium": return "bg-yellow-500"
      case "Hard": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const openProblemPage = (url: string) => {
    chrome.tabs.create({ url });
  };

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  const sortProblems = (problems: Problem[]) => {
    return problems.sort((a, b) => {
      switch (sortOption) {
        case 'id':
          return Number(a.id) - Number(b.id);
        case 'difficulty':
          const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
        case 'title':
          return a.title.localeCompare(b.title);
        case 'proficiency':
          return b.proficiency - a.proficiency; // 按熟练度降序排列
        default:
          return 0;
      }
    });
  };

  const filteredProblems = sortProblems(
    problems
      .filter(problem => getProblemStatus(problem) === activeTab)
      .filter(problem => 
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.id.toString().includes(searchTerm)
      )
  );

  const ProblemItem = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const problem = filteredProblems[index];
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              style={style}
              className="flex items-center justify-between p-3 mb-2 rounded cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-100 group"
              onClick={() => openProblemPage(problem.url)}
            >
              <div className="flex items-center flex-grow">
                <div className={`w-3 h-3 rounded-full ${getDifficultyColor(problem.difficulty)} mr-3 transition-all duration-200 ease-in-out group-hover:scale-125`}></div>
                <div className="flex flex-col flex-grow">
                  <span className="text-sm font-medium text-gray-700 transition-all duration-200 ease-in-out group-hover:translate-x-1">
                    {`${problem.id}. ${problem.title}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {`Difficulty: ${problem.difficulty}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <Progress value={(problem.proficiency / 5) * 100} className="w-16 h-2" />
                  <span className="text-xs text-gray-500">{problem.proficiency}/5</span>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{`${problem.id}. ${problem.title}`}</p>
            <p>{`Difficulty: ${problem.difficulty}`}</p>
            <p>{`Proficiency: ${problem.proficiency}/5`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="w-[400px] h-[600px] bg-white p-6 flex flex-col">
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
                itemSize={70}
                width={width}
                overscanCount={5}
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
  )
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
);
