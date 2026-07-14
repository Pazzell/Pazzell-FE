'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  RotateCcw,
  Trophy,
  CheckCircle,
  Search,
  Play,
  Pause,
  Target,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { routes } from '@/app/_utils/routes'
import { CampaignData } from '@/types'
import axios from 'axios'
import { endpointUrl } from '@/app/_utils/helper'
import { ENDPOINTS } from '@/app/_utils/endpoints'
import { useMutation } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atom/user'

const GRID_SIZE = 12
const DIRECTIONS = [
  { dr: 0, dc: 1, name: 'right' },
  { dr: 1, dc: 0, name: 'down' },
  { dr: 1, dc: 1, name: 'diagonal-down' },
  { dr: -1, dc: 1, name: 'diagonal-up' },
  { dr: 0, dc: -1, name: 'left' },
  { dr: -1, dc: 0, name: 'up' },
  { dr: -1, dc: -1, name: 'diagonal-up-left' },
  { dr: 1, dc: -1, name: 'diagonal-down-left' },
]

interface WordHuntGameProps {
  campaignDetails: CampaignData
  campaignId: string
  previewMode?: boolean
  // v2 session flow: when set, the game reports completion to the session
  // orchestrator instead of showing its own embedded quiz/submit UI.
  sessionMode?: boolean
  onGameComplete?: (movesTaken: number, timeTakenMs: number) => void
}

export function WordHuntGame({ campaignDetails, campaignId, previewMode = false, sessionMode = false, onGameComplete }: WordHuntGameProps) {
  const user = useAtomValue(userAtom)

  const [gameStarted, setGameStarted] = useState(false)
  const [gameData, setGameData] = useState<{ grid: string[][]; placedWords: { word: string; cells: { row: number; col: number; letter: string }[]; direction: string }[] } | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([])
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set())
  const [isSolved, setIsSolved] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [lastFoundWord, setLastFoundWord] = useState<string | null>(null)
  const [showQuestions, setShowQuestions] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [questionsCompleted, setQuestionsCompleted] = useState(false)
  const [showQuizResults, setShowQuizResults] = useState(false)
  const [quizAttempts, setQuizAttempts] = useState(0)
  const [pointsEarned, setPointsEarned] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const submitGameMutation = useMutation({
    mutationFn: async (submissionData: {
      timeTaken: number;
      movesTaken: number;
      solved: boolean;
      answers: number[];
    }) => {
      return axios.post(
        endpointUrl(ENDPOINTS.SUBMIT_CAMPAIGN(campaignId!)),
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );
    },
    onSuccess: (response) => {
      if (response.data.success) {
        setPointsEarned(response.data.attempt?.pointsEarned || 0);
      }
    },
    onError: (error) => {
      console.error('Failed to submit game results:', error);
    },
  });

  // Generate grid function
  function generateGrid(words: string[]) {
    const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''))
    const placedWords = []

    for (const word of words) {
      let placed = false
      let attempts = 0
      const maxAttempts = 100

      while (!placed && attempts < maxAttempts) {
        attempts++
        const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
        const startRow = Math.floor(Math.random() * GRID_SIZE)
        const startCol = Math.floor(Math.random() * GRID_SIZE)

        const endRow = startRow + direction.dr * (word.length - 1)
        const endCol = startCol + direction.dc * (word.length - 1)

        if (endRow < 0 || endRow >= GRID_SIZE || endCol < 0 || endCol >= GRID_SIZE) {
          continue
        }

        let canPlace = true
        const cells = []
        for (let i = 0; i < word.length; i++) {
          const r = startRow + direction.dr * i
          const c = startCol + direction.dc * i
          const currentCell = grid[r][c]
          if (currentCell !== '' && currentCell !== word[i]) {
            canPlace = false
            break
          }
          cells.push({ row: r, col: c, letter: word[i] })
        }

        if (canPlace) {
          cells.forEach(({ row, col, letter }) => {
            grid[row][col] = letter
          })
          placedWords.push({
            word,
            cells,
            direction: direction.name,
          })
          placed = true
        }
      }
    }

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === '') {
          grid[r][c] = letters[Math.floor(Math.random() * letters.length)]
        }
      }
    }

    return { grid, placedWords }
  }

  const startGame = () => {
    setGameStarted(true)
    setIsPlaying(true)
  }

  // Initialize game with campaign words
  useEffect(() => {
    if (campaignDetails?.words && campaignDetails.words.length > 0) {
      setGameData(generateGrid(campaignDetails.words))
    }
  }, [campaignDetails])

  // Timer logic
  useEffect(() => {
    if (isPlaying && !isSolved) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, isSolved])

  // Check for win condition
  useEffect(() => {
    if (gameData && foundWords.length === gameData.placedWords.length && gameData.placedWords.length > 0) {
      setIsSolved(true)
      setIsPlaying(false)
      if (!sessionMode) {
        setShowQuestions(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundWords, gameData])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const getCellKey = (row: number, col: number) => `${row}-${col}`

  const getCellsInLine = (start: { row: number; col: number }, end: { row: number; col: number }) => {
    const cells = []
    const dr = Math.sign(end.row - start.row)
    const dc = Math.sign(end.col - start.col)

    const rowDiff = Math.abs(end.row - start.row)
    const colDiff = Math.abs(end.col - start.col)

    if (rowDiff !== 0 && colDiff !== 0 && rowDiff !== colDiff) {
      return [start]
    }

    const steps = Math.max(rowDiff, colDiff)

    for (let i = 0; i <= steps; i++) {
      cells.push({
        row: start.row + dr * i,
        col: start.col + dc * i,
      })
    }

    return cells
  }

  const handleMouseDown = (row: number, col: number) => {
    if (!isPlaying) setIsPlaying(true)
    setSelecting(true)
    setSelectedCells([{ row, col }])
  }

  const handleMouseEnter = (row: number, col: number) => {
    if (!selecting) return

    const start = selectedCells[0]
    const cells = getCellsInLine(start, { row, col })
    setSelectedCells(cells)
  }

  const handleMouseUp = useCallback(() => {
    if (!selecting) return
    setSelecting(false)

    const selectedWord = selectedCells
      .map(({ row, col }) => gameData?.grid[row][col])
      .join('')

    const reversedWord = selectedWord.split('').reverse().join('')

    const matchedWord = gameData?.placedWords.find(
      (pw: { word: string; cells: any[]; direction: string }) => (pw.word === selectedWord || pw.word === reversedWord) && !foundWords.includes(pw.word)
    )

    if (matchedWord) {
      setFoundWords(prev => [...prev, matchedWord.word])
      setLastFoundWord(matchedWord.word)
      setTimeout(() => setLastFoundWord(null), 1500)

      const newFoundCells = new Set(foundCells)
      selectedCells.forEach(({ row, col }) => {
        newFoundCells.add(getCellKey(row, col))
      })
      setFoundCells(newFoundCells)
    }

    setSelectedCells([])
  }, [selecting, selectedCells, gameData, foundWords, foundCells])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (selecting) {
        handleMouseUp()
      }
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [selecting, handleMouseUp])

  const resetGame = () => {
    if (campaignDetails?.words && campaignDetails.words.length > 0) {
      setGameData(generateGrid(campaignDetails.words))
    }
    setSelectedCells([])
    setFoundWords([])
    setFoundCells(new Set())
    setIsSolved(false)
    setTimeElapsed(0)
    setIsPlaying(false)
    setGameStarted(false)
    setShowQuestions(false)
    setCurrentQuestion(0)
    setAnswers([])
    setSelectedAnswer(null)
    setQuestionsCompleted(false)
    setShowQuizResults(false)
    setQuizAttempts(0)
    setPointsEarned(0)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const restartQuiz = () => {
    setCurrentQuestion(0)
    setAnswers([])
    setSelectedAnswer(null)
    setShowQuizResults(false)
    setQuizAttempts(prev => prev + 1)
  }

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return
    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)
    setSelectedAnswer(null)

    if (campaignDetails?.questions && currentQuestion < campaignDetails.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowQuizResults(true)
    }
  }

  const handleSubmitResults = () => {
    setQuestionsCompleted(true)
    if (!previewMode) {
      submitGameMutation.mutate({
        timeTaken: timeElapsed * 1000,
        movesTaken: foundWords.length,
        solved: true,
        answers,
      })
    }
  }


  const isSelected = (row: number, col: number) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col)
  }

  const isFound = (row: number, col: number) => {
    return foundCells.has(getCellKey(row, col))
  }

  // Auto-start the game
  useEffect(() => {
    setIsPlaying(true)
  }, [])

  return (
    <>
      {/* Word Found Notification */}
      {lastFoundWord && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-green-500/90 rounded-full backdrop-blur-sm animate-in slide-in-from-top-4 duration-500">
          <CheckCircle className="h-5 w-5 text-white" />
          <span className="text-white font-semibold font-fredoka">{lastFoundWord}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Game Stats & Controls */}
        <div className="xl:order-2">
          {/* Stats Bar */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-secondary" />
                  <span className="font-mono text-xl text-white">{foundWords.length}</span>
                  <span className="text-xs text-white/60 uppercase tracking-wider">Found</span>
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

              {isSolved && (
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">All Words Found!</span>
                  </div>
                  <p className="text-white/70 text-sm">
                    Completed in {formatTime(timeElapsed)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Controls */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 mb-6">
            <CardContent className="pt-6 space-y-3">
              <Button
                onClick={resetGame}
                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                New Puzzle
              </Button>
            </CardContent>
          </Card>

          {/* Word List */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-white font-fredoka text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-secondary" />
                Words to Find
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {campaignDetails?.words?.map((word: string) => {
                  const isWordFound = foundWords.includes(word)
                  return (
                    <div
                      key={word}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isWordFound
                          ? 'bg-green-500/20 border border-green-500/30'
                          : 'bg-white/5'
                      }`}
                    >
                      {isWordFound && <CheckCircle className="h-4 w-4 text-green-400" />}
                      <span className={`font-mono font-semibold tracking-wider ${
                        isWordFound
                          ? 'text-green-400 line-through'
                          : 'text-white/70'
                      }`}>
                        {word}
                      </span>
                    </div>
                  )
                }) || []}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/60">Progress</span>
                  <span className="text-secondary font-semibold">
                    {campaignDetails?.words ? Math.round((foundWords.length / campaignDetails.words.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-secondary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${campaignDetails?.words ? (foundWords.length / campaignDetails.words.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Grid */}
        <div className="xl:col-span-3 xl:order-1">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <div className="relative">
                <div
                  className="grid gap-1 bg-white/5 rounded p-2 sm:p-4 select-none mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg aspect-square"
                  style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  }}
                  onMouseLeave={() => {
                    if (selecting) {
                      handleMouseUp()
                    }
                  }}
                  onTouchEnd={() => {
                    if (selecting) {
                      handleMouseUp()
                    }
                  }}
                >
                  {gameData?.grid?.map((row, rowIndex) => (
                    row.map((letter, colIndex) => {
                      const selected = isSelected(rowIndex, colIndex)
                      const found = isFound(rowIndex, colIndex)

                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            aspect-square flex items-center justify-center text-xs sm:text-sm font-mono font-bold cursor-pointer
                            rounded-md transition-all duration-150 border touch-manipulation
                            ${selected
                              ? 'bg-secondary border-secondary text-secondary-foreground scale-105'
                              : found
                                ? 'bg-green-500/30 border-green-500/50 text-green-400'
                                : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 active:bg-white/30'
                            }
                          `}
                          onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                          onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                          onTouchStart={(e) => {
                            e.preventDefault()
                            handleMouseDown(rowIndex, colIndex)
                          }}
                          onTouchMove={(e) => {
                            e.preventDefault()
                            const touch = e.touches[0]
                            const element = document.elementFromPoint(touch.clientX, touch.clientY)
                            if (element && (element as HTMLElement).dataset.row && (element as HTMLElement).dataset.col) {
                              handleMouseEnter(parseInt((element as HTMLElement).dataset.row!), parseInt((element as HTMLElement).dataset.col!))
                            }
                          }}
                          data-row={rowIndex}
                          data-col={colIndex}
                        >
                          {letter}
                        </div>
                      )
                    })
                  )) || []}
                </div>

                {/* Start Overlay */}
                {!gameStarted && gameData && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
                    <Play className="h-16 w-16 text-secondary mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-2 font-fredoka">Ready to Play?</h2>
                    <p className="text-white/70 mb-6">Find all the words hidden in the grid!</p>
                    <Button
                      onClick={startGame}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-8 py-3"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Game
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-center mt-6">
                <p className="text-white/70 text-sm">
                  <span className="hidden sm:inline">Click and drag</span><span className="sm:hidden">Tap and drag</span> to select words - Words can go in any direction
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Win Overlay */}
      {isSolved && sessionMode && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <Trophy className="h-16 w-16 text-yellow-400 mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold text-white mb-2 font-fredoka">All Words Found!</h2>
          <Button
            onClick={() => onGameComplete?.(foundWords.length, timeElapsed * 1000)}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-8 py-3 mt-2">
            Next Game
          </Button>
        </div>
      )}

      {/* Brand Questions Modal */}
      {showQuestions && campaignDetails?.questions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="bg-card/95 backdrop-blur-sm border-white/10 w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white font-fredoka text-2xl">
                    {questionsCompleted ? 'Challenge Complete!' : showQuizResults ? 'Quiz Results' : 'Brand Quiz'}
                  </CardTitle>
                  {!showQuizResults && !questionsCompleted && (
                    <CardDescription className="text-white/70">
                      Answer questions about {campaignDetails.brandName} to complete the challenge
                    </CardDescription>
                  )}
                </div>
                {!showQuizResults && !questionsCompleted && (
                  <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                    {currentQuestion + 1} / {campaignDetails.questions.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questionsCompleted ? (
                <div className="text-center space-y-4">
                  <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
                  {previewMode ? (
                    <>
                      <h3 className="text-2xl font-bold text-white font-fredoka">Preview Complete!</h3>
                      <p className="text-white/80">All words found in {formatTime(timeElapsed)}</p>
                      <p className="text-white/60">This is how players will experience your campaign.</p>
                      <Button onClick={resetGame} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka mt-4">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Play Again
                      </Button>
                    </>
                  ) : (
                    <>
                      {submitGameMutation.isPending && (
                        <div className="flex items-center justify-center gap-2 text-secondary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Submitting results...</span>
                        </div>
                      )}
                      {submitGameMutation.isSuccess && (
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-semibold">Results Submitted!</span>
                          </div>
                          {pointsEarned > 0 ? (
                            <p className="text-2xl font-bold text-secondary font-fredoka">+{pointsEarned} Points Earned!</p>
                          ) : (
                            <p className="text-sm text-yellow-300/90 bg-yellow-500/15 border border-yellow-500/40 rounded-lg px-4 py-2">
                              You already earned points for this campaign today. Come back tomorrow!
                            </p>
                          )}
                        </div>
                      )}
                      {submitGameMutation.isError && (
                        <p className="text-red-400 text-sm">Failed to submit results. Please try again.</p>
                      )}
                      <div className="flex gap-3 justify-center pt-2">
                        <Link href={routes.USER.DASHBOARD}>
                          <Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka" disabled={submitGameMutation.isPending}>
                            Dashboard
                          </Button>
                        </Link>
                        <Link href={routes.CAMPAIGNS}>
                          <Button variant="outline" className="border-secondary text-white hover:bg-secondary hover:text-secondary-foreground" disabled={submitGameMutation.isPending}>
                            More Campaigns
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ) : showQuizResults ? (
                (() => {
                  const total = campaignDetails.questions.length
                  const score = answers.reduce((acc, a, i) =>
                    acc + (a === campaignDetails.questions[i]?.correctIndex ? 1 : 0), 0)
                  const allCorrect = score === total
                  return (
                    <div className="text-center space-y-4">
                      <div className={`text-6xl font-bold font-fredoka mb-2 ${allCorrect ? 'text-green-400' : 'text-secondary'}`}>
                        {score}/{total}
                      </div>
                      {allCorrect ? (
                        <>
                          <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                          <h3 className="text-xl font-bold text-white font-fredoka">Perfect Score!</h3>
                          <p className="text-white/70">You answered all questions correctly. Submit to claim your points!</p>
                          <Button onClick={handleSubmitResults} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-10 h-12 mt-4">
                            Submit &amp; See Results
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-white/80">You need a perfect score to complete the challenge.</p>
                          <p className="text-white/60 text-sm">{quizAttempts > 0 ? `Attempt #${quizAttempts + 1}` : 'Give it another shot!'}</p>
                          <Button onClick={restartQuiz} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-8 mt-4">
                            Try Again
                          </Button>
                        </>
                      )}
                    </div>
                  )
                })()
              ) : (
                <>
                  {campaignDetails.passage && (
                    <div
                      className="bg-white/5 border border-white/10 rounded-lg p-4 mb-2 select-none"
                      onContextMenu={(e) => e.preventDefault()}
                      onCopy={(e) => e.preventDefault()}
                    >
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-2 font-semibold">Read the passage</p>
                      <p className="text-white/80 text-sm leading-relaxed">{campaignDetails.passage}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-6">
                      {campaignDetails.questions[currentQuestion]?.question}
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {(campaignDetails.questions[currentQuestion]?.choices || []).map((choice: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          className={`p-4 rounded-lg text-left transition-all ${
                            selectedAnswer === index
                              ? 'bg-secondary/20 border-2 border-secondary text-white'
                              : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {choice}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleNextQuestion}
                      disabled={selectedAnswer === null}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentQuestion === campaignDetails.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
