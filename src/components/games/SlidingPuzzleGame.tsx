'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  RotateCcw,
  Trophy,
  CheckCircle,
  Grid3X3,
  Play,
  Loader2,
  Timer
} from 'lucide-react'
import Link from 'next/link'
import { routes } from '@/app/_utils/routes'
import { CampaignData } from '@/types'
import axios from 'axios'
import { endpointUrl, markPlayedToday } from '@/app/_utils/helper'
import { ENDPOINTS } from '@/app/_utils/endpoints'
import { getNextCampaignUrl } from '@/app/_utils/campaign-navigation'
import { useMutation } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atom/user'
import Image from 'next/image'

interface SlidingPuzzleGameProps {
  campaignDetails: CampaignData
  campaignId: string
  previewMode?: boolean
  availableCampaigns?: CampaignData[]
  // v2 session flow: when set, the game reports completion to the session
  // orchestrator instead of showing its own embedded quiz/submit UI.
  sessionMode?: boolean
  onGameComplete?: (movesTaken: number, timeTakenMs: number) => void
}

export function SlidingPuzzleGame({ campaignDetails, campaignId, previewMode = false, availableCampaigns, sessionMode = false, onGameComplete }: SlidingPuzzleGameProps) {
  const user = useAtomValue(userAtom)

  const [gridSize] = useState(3)
  const [tiles, setTiles] = useState<number[]>([])
  const [emptyIndex, setEmptyIndex] = useState(8)
  const [moves, setMoves] = useState(0)
  const [isSolved, setIsSolved] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [timeElapsed, setTimeElapsed] = useState(0)

  // MCQ states
  const [showQuestions, setShowQuestions] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [questionsCompleted, setQuestionsCompleted] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [quizAttempts, setQuizAttempts] = useState(0)
  const [showQuizResults, setShowQuizResults] = useState(false)

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
        setPointsEarned(response.data.attempt?.pointsEarned ?? 0);
        markPlayedToday(campaignId);
      }
    },
    onError: (error) => {
      console.error('Failed to submit game results:', error);
    },
  });

  // Update image URL when campaign details are loaded
  useEffect(() => {
    if (campaignDetails?.puzzleImageUrl) {
      setImageUrl(campaignDetails.puzzleImageUrl)
    }
  }, [campaignDetails])

  // Reset all game state when campaignId changes
  useEffect(() => {
    if (campaignId) {
      setMoves(0)
      setIsSolved(false)
      setIsPlaying(false)
      setGameStarted(false)
      setTimeElapsed(0)
      setShowQuestions(false)
      setCurrentQuestion(0)
      setAnswers([])
      setSelectedAnswer(null)
      setQuestionsCompleted(false)
      setPointsEarned(0)
      setQuizAttempts(0)
      setShowQuizResults(false)
      setTiles([])
      setEmptyIndex(8)
    }
  }, [campaignId])

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  // Get adjacent indices for a given index
  const getAdjacentIndices = (index: number): number[] => {
    const adjacent: number[] = []
    const row = Math.floor(index / gridSize)
    const col = index % gridSize

    if (row > 0) adjacent.push(index - gridSize)
    if (row < gridSize - 1) adjacent.push(index + gridSize)
    if (col > 0) adjacent.push(index - 1)
    if (col < gridSize - 1) adjacent.push(index + 1)

    return adjacent
  }

  const resetGame = () => {
    const totalTiles = gridSize * gridSize
    let currentTiles = Array.from({ length: totalTiles }, (_, i) => i)
    let currentEmpty = totalTiles - 1

    for (let i = 0; i < 200; i++) {
      const adjacent = getAdjacentIndices(currentEmpty)
      const randomIndex = adjacent[Math.floor(Math.random() * adjacent.length)]

      const temp = currentTiles[currentEmpty]
      currentTiles[currentEmpty] = currentTiles[randomIndex]
      currentTiles[randomIndex] = temp
      currentEmpty = randomIndex
    }

    setTiles(currentTiles)
    setEmptyIndex(currentEmpty)
    setMoves(0)
    setIsSolved(false)
    setIsPlaying(false)
    setGameStarted(false)
    setTimeElapsed(0)
    setShowQuestions(false)
    setCurrentQuestion(0)
    setAnswers([])
    setSelectedAnswer(null)
    setQuestionsCompleted(false)
    setPointsEarned(0)
    setQuizAttempts(0)
    setShowQuizResults(false)
  }

  const startGame = () => {
    setGameStarted(true)
    setIsPlaying(true)
  }

  // Initialize the puzzle
  useEffect(() => {
    resetGame()
    return () => stopTimer()
  }, [])

  // Timer logic
  useEffect(() => {
    if (isPlaying && !isSolved && gameStarted) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    } else {
      stopTimer()
    }
    return () => stopTimer()
  }, [isPlaying, isSolved, gameStarted])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const checkSolved = (currentTiles: number[]) => {
    const isCorrect = currentTiles.every((val, index) => val === index)
    if (isCorrect) {
      setIsSolved(true)
      setIsPlaying(false)
      if (!sessionMode) {
        setTimeout(() => setShowQuestions(true), 2000)
      }
    }
  }

  // MCQ Functions
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

    if (currentQuestion < (campaignDetails?.questions.length || 0) - 1) {
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
        movesTaken: moves,
        solved: true,
        answers,
      })
    }
  }

  const handleTileClick = (index: number) => {
    if (isSolved || !isPlaying || !gameStarted) return

    const adjacent = getAdjacentIndices(emptyIndex)
    if (adjacent.includes(index)) {
      const newTiles = [...tiles]
      const temp = newTiles[index]
      newTiles[index] = newTiles[emptyIndex]
      newTiles[emptyIndex] = temp

      setTiles(newTiles)
      setEmptyIndex(index)
      setMoves(prev => prev + 1)

      if (!isPlaying) setIsPlaying(true)

      checkSolved(newTiles)
    }
  }

  return (
    <>
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
                  <Timer className="h-5 w-5 text-green-400" />
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
                {/* Start Overlay */}
                {!gameStarted && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg">
                    <Image
                      src={'/icons/puzzle-icon.png'}
                      alt=""
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                    <h2 className="text-2xl font-bold text-white mb-2 font-fredoka">Ready to Play?</h2>
                    <p className="text-white/80 mb-4 text-center text-sm">Click start to begin the puzzle challenge</p>

                    <Button
                      onClick={startGame}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-6 py-2"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Game
                    </Button>
                  </div>
                )}

                <div
                  className="grid gap-1 bg-white/5 rounded border border-white/20 w-full max-w-sm aspect-square"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  }}
                >
                  {tiles.map((tileNumber, index) => {
                    if (tileNumber === gridSize * gridSize - 1 && !isSolved) {
                      return <div key={`empty-${index}`} className="bg-transparent rounded-sm" />
                    }

                    const originalRow = Math.floor(tileNumber / gridSize)
                    const originalCol = tileNumber % gridSize

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
                          backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                          backgroundPosition: `-${originalCol * 100}% -${originalRow * 100}%`
                        }}
                      >
                      </div>
                    )
                  })}
                </div>
              </div>

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
                {questionsCompleted ? 'Challenge Complete!' : showQuizResults ? 'Quiz Results' : `Learn About ${campaignDetails?.brandName}`}
              </CardTitle>
              {!showQuizResults && !questionsCompleted && (
                <p className="text-white/70">
                  Question {currentQuestion + 1} of {campaignDetails?.questions.length || 0}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {questionsCompleted ? (
                <div className="text-center space-y-4">
                  <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  {previewMode ? (
                    <>
                      <h3 className="text-2xl font-bold text-white font-fredoka">Preview Complete!</h3>
                      <p className="text-white/80 mb-2">Puzzle completed in {formatTime(timeElapsed)} with {moves} moves</p>
                      <p className="text-white/60">This is how players will experience your campaign.</p>
                      <div className="flex gap-3 justify-center pt-4">
                        <Button onClick={resetGame} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Play Again
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {submitGameMutation.isPending && (
                        <div className="flex items-center justify-center gap-2 text-secondary my-4">
                          <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                          <span>Submitting results...</span>
                        </div>
                      )}
                      {submitGameMutation.isSuccess && (
                        <div className="my-4">
                          <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-semibold">Results Submitted!</span>
                          </div>
                          {pointsEarned > 0 ? (
                            <p className="text-2xl font-bold text-secondary font-fredoka">+{pointsEarned} Points Earned!</p>
                          ) : (
                            <p className="text-sm text-yellow-300/90 bg-yellow-500/15 border border-yellow-500/40 rounded-lg px-4 py-2">
                              You already earned points for this campaign today. Come back tomorrow for more!
                            </p>
                          )}
                        </div>
                      )}
                      {submitGameMutation.isError && (
                        <p className="text-red-400 text-sm my-4">Failed to submit results. Please try again.</p>
                      )}
                      <p className="text-white/60">Thanks for learning more about {campaignDetails?.brandName}!</p>
                      <div className="flex gap-3 justify-center pt-4">
                        <Link href={routes.USER.DASHBOARD}>
                          <Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka" disabled={submitGameMutation.isPending}>
                            Dashboard
                          </Button>
                        </Link>
                        {(() => {
                          const nextCampaignUrl = getNextCampaignUrl(availableCampaigns, campaignId, 'sliding_puzzle')
                          return nextCampaignUrl ? (
                            <Link href={nextCampaignUrl}>
                              <Button variant="outline" className="border-white/20 text-white hover:bg-white/90" disabled={submitGameMutation.isPending}>
                                Next Campaign
                              </Button>
                            </Link>
                          ) : (
                            <Link href={routes.CAMPAIGNS}>
                              <Button variant="outline" className="border-white/20 text-white hover:bg-white/90" disabled={submitGameMutation.isPending}>
                                Browse Campaigns
                              </Button>
                            </Link>
                          )
                        })()}
                      </div>
                    </>
                  )}
                </div>
              ) : showQuizResults ? (
                (() => {
                  const total = campaignDetails?.questions.length || 0
                  const score = answers.reduce((acc, a, i) =>
                    acc + (a === campaignDetails?.questions[i]?.correctIndex ? 1 : 0), 0)
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
                          <Button
                            onClick={handleSubmitResults}
                            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-10 h-12 mt-4"
                          >
                            Submit & See Results
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-white/80">You need a perfect score to complete the challenge.</p>
                          <p className="text-white/60 text-sm">
                            {quizAttempts > 0 ? `Attempt #${quizAttempts + 1}` : 'Give it another shot!'}
                          </p>
                          <Button
                            onClick={restartQuiz}
                            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-8 mt-4"
                          >
                            Try Again
                          </Button>
                        </>
                      )}
                    </div>
                  )
                })()
              ) : (
                <>
                  {campaignDetails?.passage && (
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
                    <h3 className="text-white text-xl mb-4 font-medium">
                      {campaignDetails?.questions[currentQuestion]?.question}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {campaignDetails?.questions[currentQuestion]?.choices.map((option, index) => (
                      <Button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        variant={selectedAnswer === index ? "default" : "outline"}
                        className={`p-4 text-left justify-start h-auto ${
                          selectedAnswer === index
                            ? 'bg-secondary text-secondary-foreground'
                            : 'border-white/20 text-white hover:bg-white/90'
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
                      {currentQuestion < (campaignDetails?.questions.length || 0) - 1 ? 'Next Question' : 'Finish Quiz'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Win Overlay */}
      {isSolved && moves > 0 && !showQuestions && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <Trophy className="h-16 w-16 text-yellow-400 mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold text-white mb-2 font-fredoka">Solved!</h2>
          {sessionMode ? (
            <Button
              onClick={() => onGameComplete?.(moves, timeElapsed * 1000)}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-8 py-3 mt-2">
              Next Game
            </Button>
          ) : (
            <p className="text-white/80 mb-6">In {formatTime(timeElapsed)} and {moves} moves</p>
          )}
        </div>
      )}
    </>
  )
}
