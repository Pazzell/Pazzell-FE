'use client'

import { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RotateCcw, 
  Shuffle, 
  Trophy, 
  CheckCircle,
  ArrowLeft,
  Grid3X3,
  Play,
  Pause
} from 'lucide-react'
import Link from 'next/link'
import { routes } from '@/app/_utils/routes'

// Mock puzzle data (would come from props/URL in real app)
const puzzleData = {
  campaignTitle: 'Nike Summer Challenge',
  brand: 'Nike',
  puzzleType: 'Sliding Puzzle',
  timeLimit: 300, // 5 minutes in seconds
}

// Default image to start with
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format"

// Brand MCQ Questions
const BRAND_QUESTIONS = [
  {
    question: "What year was Nike founded?",
    options: ["1964", "1972", "1978", "1980"],
    correct: 0
  },
  {
    question: "What is Nike's famous slogan?",
    options: ["Impossible is Nothing", "Just Do It", "The Future is Yours", "Be More Human"],
    correct: 1
  },
  {
    question: "Nike's logo is called the:",
    options: ["Check", "Swoosh", "Wing", "Arrow"],
    correct: 1
  }
]

export default function PlayPuzzlePage() {
  const [gridSize] = useState(3)
  const [tiles, setTiles] = useState<number[]>([])
  const [emptyIndex, setEmptyIndex] = useState(8) // Last position is empty by default
  const [moves, setMoves] = useState(0)
  const [isSolved, setIsSolved] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE)
  const [timeElapsed, setTimeElapsed] = useState(0)
  
  // MCQ states
  const [showQuestions, setShowQuestions] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [questionsCompleted, setQuestionsCompleted] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Get adjacent indices for a given index
  const getAdjacentIndices = (index: number): number[] => {
    const adjacent: number[] = []
    const row = Math.floor(index / gridSize)
    const col = index % gridSize

    if (row > 0) adjacent.push(index - gridSize) // Up
    if (row < gridSize - 1) adjacent.push(index + gridSize) // Down
    if (col > 0) adjacent.push(index - 1) // Left
    if (col < gridSize - 1) adjacent.push(index + 1) // Right

    return adjacent
  }

  // Shuffle the board by simulating random valid moves
  // This ensures the puzzle is always solvable
  const shuffleBoard = () => {
    const totalTiles = gridSize * gridSize
    let currentTiles = Array.from({ length: totalTiles }, (_, i) => i)
    let currentEmpty = totalTiles - 1
    let previousMove = -1

    // Perform many random valid moves
    for (let i = 0; i < 150; i++) {
      const adjacent = getAdjacentIndices(currentEmpty)
      // Filter out the tile we just moved to avoid immediate backtracking
      const validMoves = adjacent.filter(idx => idx !== previousMove)
      
      // If no valid moves, use all adjacent tiles
      const movesToChooseFrom = validMoves.length > 0 ? validMoves : adjacent
      
      // Safety check to ensure we have moves to choose from
      if (movesToChooseFrom.length === 0) continue
      
      const randomMove = movesToChooseFrom[Math.floor(Math.random() * movesToChooseFrom.length)]
      
      // Safety check to ensure randomMove is defined
      if (randomMove === undefined) continue
      
      // Swap using temporary variable
      const temp = currentTiles[currentEmpty]
      currentTiles[currentEmpty] = currentTiles[randomMove]
      currentTiles[randomMove] = temp
      previousMove = currentEmpty
      currentEmpty = randomMove
    }

    setTiles(currentTiles)
    setEmptyIndex(currentEmpty)
    setMoves(0)
    setIsSolved(false)
    setIsPlaying(true)
    setTimeElapsed(0)
  }

  // Initialize the puzzle
  useEffect(() => {
    resetGame()
    shuffleBoard()
    return () => stopTimer()
  }, [])

  // Timer logic
  useEffect(() => {
    if (isPlaying && !isSolved) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    } else {
      stopTimer()
    }
    return () => stopTimer()
  }, [isPlaying, isSolved])

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Reset / Initialize Game
  const resetGame = () => {
    const totalTiles = gridSize * gridSize
    // Create solved state: [0, 1, 2, ..., 8]
    const solvedState = Array.from({ length: totalTiles }, (_, i) => i)
    
    setTiles(solvedState)
    setEmptyIndex(totalTiles - 1)
    setMoves(0)
    setIsSolved(true) // Technically solved at start until shuffled
    setIsPlaying(false)
    setTimeElapsed(0)
    stopTimer()
  }

  // Check if solved
  const checkSolved = (currentTiles: number[]) => {
    const isCorrect = currentTiles.every((val, index) => val === index)
    if (isCorrect) {
      setIsSolved(true)
      setIsPlaying(false)
      // Trigger MCQ after a short delay
      setTimeout(() => {
        setShowQuestions(true)
      }, 2000)
    }
  }

  // MCQ Functions
  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers, selectedAnswer]
      setAnswers(newAnswers)
      
      if (currentQuestion < BRAND_QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
      } else {
        setQuestionsCompleted(true)
      }
    }
  }

  const handleQuestionsComplete = () => {
    setShowQuestions(false)
    setQuestionsCompleted(false)
    setCurrentQuestion(0)
    setAnswers([])
    setSelectedAnswer(null)
  }

  // Handle tile click
  const handleTileClick = (index: number) => {
    if (isSolved && !isPlaying) return // Can't move if game over/not started

    // Check if clicked tile is adjacent to empty slot
    const adjacent = getAdjacentIndices(emptyIndex)
    if (adjacent.includes(index)) {
      const newTiles = [...tiles]
      // Swap using temporary variable
      const temp = newTiles[index]
      newTiles[index] = newTiles[emptyIndex]
      newTiles[emptyIndex] = temp
      
      setTiles(newTiles)
      setEmptyIndex(index)
      setMoves(prev => prev + 1)
      
      if (!isPlaying) setIsPlaying(true) // Auto start if they just click and drag manually
      
      checkSolved(newTiles)
    }
  }


  return (
    <MainLayout maxWidth="5xl">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href={routes.CAMPAIGNS} 
          className="inline-flex items-center gap-2 text-white/70 hover:text-secondary transition-colors text-sm mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 font-fredoka">
              {puzzleData.campaignTitle}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-white/70">{puzzleData.brand}</span>
              <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                {puzzleData.puzzleType}
              </Badge>
            </div>
          </div>
          
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Game Stats & Controls */}
        <div className="lg:order-2">
          {/* Stats Bar */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-secondary" />
                  <span className="font-mono text-xl text-white">{moves}</span>
                  <span className="text-xs text-white/60 uppercase tracking-wider">Moves</span>
                </div>
                <div className="h-8 w-px bg-white/20"></div>
                <div className="flex items-center gap-2">
                  {isPlaying && !isSolved ? 
                    <Play className="h-5 w-5 text-green-400" /> : 
                    <Pause className="h-5 w-5 text-yellow-400" />
                  }
                  <span className="font-mono text-xl w-16 text-right text-white">{formatTime(timeElapsed)}</span>
                </div>
              </div>

              {isSolved && moves > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Puzzle Complete!</span>
                  </div>
                  <p className="text-white/70 text-sm">
                    Completed in {moves} moves and {formatTime(timeElapsed)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Controls */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 mb-6">
            <CardContent className="pt-6 space-y-3">
              <Button 
                onClick={shuffleBoard}
                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Shuffle Board
              </Button>
              
              <Button 
                onClick={resetGame}
                variant="outline"
                className="w-full border-white/20 text-white/70 hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Game
              </Button>
            </CardContent>
          </Card>


          {/* Reference Image */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-white font-fredoka text-lg flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-secondary" />
                Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square w-full rounded-lg overflow-hidden border-2 border-white/20 bg-white/5 relative group">
                <img 
                  src={imageUrl} 
                  alt="Reference" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                />
                <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white backdrop-blur-md">
                  Target
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Puzzle Grid */}
        <div className="lg:col-span-2 lg:order-1">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <div className="relative p-2 bg-card rounded-lg border border-white/10 flex justify-center">
                <div 
                  className="grid gap-1 bg-white/5 rounded border border-white/20 w-full max-w-sm aspect-square"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  }}
                >
                  {tiles.map((tileNumber, index) => {
                    // If it's the empty slot and game isn't solved, render empty space
                    if (tileNumber === gridSize * gridSize - 1 && !isSolved) {
                      return <div key={`empty-${index}`} className="bg-transparent rounded-sm" />
                    }

                    // Calculate position of this tile in the original image
                    const originalRow = Math.floor(tileNumber / gridSize)
                    const originalCol = tileNumber % gridSize
                    
                    const percentX = originalCol * 100 / (gridSize - 1)
                    const percentY = originalRow * 100 / (gridSize - 1)

                    const adjacent = getAdjacentIndices(emptyIndex)
                    const isMoveable = adjacent.includes(index) && isPlaying && !isSolved

                    return (
                      <div
                        key={`tile-${tileNumber}`}
                        onClick={() => handleTileClick(index)}
                        className={`
                          relative cursor-pointer overflow-hidden rounded-sm transition-all duration-200 
                          ${isMoveable ? 'hover:brightness-110 hover:scale-105 ring-2 ring-secondary/30' : ''}
                          ${isSolved ? 'cursor-default' : 'shadow-md'}
                        `}
                        style={{
                          backgroundImage: `url(${imageUrl})`,
                          backgroundSize: `${gridSize * 100}%`,
                          backgroundPosition: `${percentX}% ${percentY}%`
                        }}
                      >
                      </div>
                    )
                  })}
                </div>

                {/* Win Overlay */}
                {isSolved && moves > 0 && !showQuestions && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4 animate-bounce" />
                    <h2 className="text-3xl font-bold text-white mb-2 font-fredoka">Solved!</h2>
                    <p className="text-white/80 mb-6">In {formatTime(timeElapsed)} and {moves} moves</p>
                    <div className="flex gap-3">
                      <Button 
                        onClick={shuffleBoard}
                        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
                      >
                        Play Again
                      </Button>
                      <Link href={routes.CAMPAIGNS}>
                        <Button 
                          variant="outline"
                          className="border-secondary text-white hover:bg-secondary hover:text-secondary-foreground"
                        >
                          Next Puzzle
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              {isSolved && moves === 0 && (
                <div className="text-center mt-6">
                  <p className="text-white/70 text-sm">
                    Click "Shuffle Board" to start playing
                  </p>
                </div>
              )}
              
              {!isSolved && isPlaying && (
                <div className="text-center mt-6">
                  <p className="text-white/70 text-sm">
                    Click on tiles adjacent to the empty space to move them
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MCQ Modal */}
      {showQuestions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-card/95 border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-white font-fredoka text-2xl mb-2">
                Learn About {puzzleData.brand}
              </CardTitle>
              <p className="text-white/70">
                Question {currentQuestion + 1} of {BRAND_QUESTIONS.length}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!questionsCompleted ? (
                <>
                  <div className="text-center">
                    <h3 className="text-white text-xl mb-4 font-medium">
                      {BRAND_QUESTIONS[currentQuestion].question}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {BRAND_QUESTIONS[currentQuestion].options.map((option, index) => (
                      <Button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        variant={selectedAnswer === index ? "default" : "outline"}
                        className={`p-4 text-left justify-start h-auto ${
                          selectedAnswer === index 
                            ? 'bg-secondary text-secondary-foreground' 
                            : 'border-white/20 text-white hover:bg-white/10'
                        }`}
                      >
                        <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex justify-center pt-4">
                    <Button 
                      onClick={handleNextQuestion}
                      disabled={selectedAnswer === null}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-8"
                    >
                      {currentQuestion < BRAND_QUESTIONS.length - 1 ? 'Next Question' : 'Finish'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white font-fredoka">Great Job!</h3>
                  <p className="text-white/70 text-lg">
                    You scored {answers.reduce((score, answer, index) => 
                      score + (answer === BRAND_QUESTIONS[index].correct ? 1 : 0), 0
                    )} out of {BRAND_QUESTIONS.length} correct!
                  </p>
                  <p className="text-white/60">
                    Thanks for learning more about {puzzleData.brand}!
                  </p>
                  <div className="flex gap-3 justify-center pt-4">
                    <Button 
                      onClick={handleQuestionsComplete}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
                    >
                      Continue
                    </Button>
                    <Button 
                      onClick={() => {
                        handleQuestionsComplete()
                        shuffleBoard()
                      }}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Play Again
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </MainLayout>
  )
}