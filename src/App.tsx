import { useState, useEffect, useCallback } from 'react'
import { Card } from './components/ui/card'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Pause, Play, RotateCcw, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'
import { GaelicFace } from './components/GaelicFace'

// Tetris piece definitions with Celtic-inspired naming
const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-emerald-500', name: 'Spear' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-amber-500', name: 'Shield' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500', name: 'Triskele' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500', name: 'Serpent' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500', name: 'Lightning' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500', name: 'Crook' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500', name: 'Flail' }
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const INITIAL_SPEED = 1000 // milliseconds

function App() {
  const [board, setBoard] = useState(() => Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)))
  const [currentPiece, setCurrentPiece] = useState(null)
  const [currentPosition, setCurrentPosition] = useState({ x: 4, y: 0 })
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [linesCleared, setLinesCleared] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [dropTime, setDropTime] = useState(INITIAL_SPEED)

  // Generate a random tetromino
  const getRandomPiece = useCallback(() => {
    const pieces = Object.keys(TETROMINOES)
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)]
    return {
      type: randomPiece,
      shape: TETROMINOES[randomPiece].shape,
      color: TETROMINOES[randomPiece].color,
      name: TETROMINOES[randomPiece].name
    }
  }, [])

  // Check if a piece can be placed at a position
  const canPlacePiece = useCallback((piece, position, testBoard = board) => {
    return piece.shape.every((row, dy) =>
      row.every((cell, dx) => {
        if (cell === 0) return true
        const x = position.x + dx
        const y = position.y + dy
        return (
          x >= 0 && x < BOARD_WIDTH &&
          y >= 0 && y < BOARD_HEIGHT &&
          testBoard[y][x] === 0
        )
      })
    )
  }, [board])

  // Place piece on board
  const placePiece = useCallback((piece, position) => {
    const newBoard = board.map(row => [...row])
    piece.shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell === 1) {
          const x = position.x + dx
          const y = position.y + dy
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            newBoard[y][x] = piece.color
          }
        }
      })
    })
    return newBoard
  }, [board])

  // Clear completed lines
  const clearLines = useCallback((board) => {
    const newBoard = board.filter(row => !row.every(cell => cell !== 0))
    const clearedLines = BOARD_HEIGHT - newBoard.length
    
    if (clearedLines > 0) {
      const emptyRows = Array(clearedLines).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
      return { board: [...emptyRows, ...newBoard], clearedLines }
    }
    return { board, clearedLines: 0 }
  }, [])

  // Rotate piece
  const rotatePiece = (piece) => {
    const rotated = piece.shape[0].map((_, i) =>
      piece.shape.map(row => row[i]).reverse()
    )
    return { ...piece, shape: rotated }
  }

  // Move piece
  const movePiece = useCallback((dx, dy, rotate = false) => {
    if (!currentPiece || isPaused || gameOver) return

    const newPiece = rotate ? rotatePiece(currentPiece) : currentPiece
    const newPosition = { x: currentPosition.x + dx, y: currentPosition.y + dy }

    if (canPlacePiece(newPiece, newPosition)) {
      setCurrentPiece(newPiece)
      setCurrentPosition(newPosition)
      return true
    }

    // If moving down and can't place, lock the piece
    if (dy > 0) {
      const newBoard = placePiece(currentPiece, currentPosition)
      const { board: clearedBoard, clearedLines } = clearLines(newBoard)
      
      setBoard(clearedBoard)
      setLinesCleared(prev => prev + clearedLines)
      setScore(prev => prev + clearedLines * 100 * level + 10)
      
      // Generate new piece
      const newPiece = getRandomPiece()
      const startPosition = { x: 4, y: 0 }
      
      if (canPlacePiece(newPiece, startPosition, clearedBoard)) {
        setCurrentPiece(newPiece)
        setCurrentPosition(startPosition)
      } else {
        setGameOver(true)
        setIsPlaying(false)
      }
    }
    return false
  }, [currentPiece, currentPosition, canPlacePiece, placePiece, clearLines, level, getRandomPiece, isPaused, gameOver])

  // Game loop
  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return

    const interval = setInterval(() => {
      movePiece(0, 1)
    }, dropTime)

    return () => clearInterval(interval)
  }, [isPlaying, isPaused, gameOver, dropTime, movePiece])

  // Update level and speed
  useEffect(() => {
    const newLevel = Math.floor(linesCleared / 10) + 1
    setLevel(newLevel)
    setDropTime(Math.max(100, INITIAL_SPEED - (newLevel - 1) * 100))
  }, [linesCleared])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isPlaying || isPaused || gameOver) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          movePiece(-1, 0)
          break
        case 'ArrowRight':
          e.preventDefault()
          movePiece(1, 0)
          break
        case 'ArrowDown':
          e.preventDefault()
          movePiece(0, 1)
          break
        case 'ArrowUp':
        case ' ':
          e.preventDefault()
          movePiece(0, 0, true)
          break
        case 'p':
        case 'P':
          setIsPaused(prev => !prev)
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, isPaused, gameOver, movePiece])

  // Start new game
  const startNewGame = () => {
    const newBoard = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
    const newPiece = getRandomPiece()
    
    setBoard(newBoard)
    setCurrentPiece(newPiece)
    setCurrentPosition({ x: 4, y: 0 })
    setScore(0)
    setLevel(1)
    setLinesCleared(0)
    setGameOver(false)
    setIsPaused(false)
    setIsPlaying(true)
    setDropTime(INITIAL_SPEED)
  }

  // Render board with current piece
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row])
    
    // Add current piece to display board
    if (currentPiece) {
      currentPiece.shape.forEach((row, dy) => {
        row.forEach((cell, dx) => {
          if (cell === 1) {
            const x = currentPosition.x + dx
            const y = currentPosition.y + dy
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              displayBoard[y][x] = currentPiece.type
            }
          }
        })
      })
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className={`w-6 h-6 border border-stone-600 bg-stone-900 shadow-inner flex items-center justify-center p-0.5`}
            style={{
              boxShadow: cell !== 0 ? 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)' : ''
            }}
          >
            {cell !== 0 && <GaelicFace type={cell} className="w-full h-full" />}
          </div>
        ))}
      </div>
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-stone-900 to-amber-900 text-amber-100 p-4">
      {/* Celtic border pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-full border-8 border-amber-600" 
             style={{
               borderImage: 'repeating-linear-gradient(45deg, #d97706, #d97706 10px, #92400e 10px, #92400e 20px) 8'
             }}>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-amber-300 mb-2 tracking-wider" 
              style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            CLOCH FHADA
          </h1>
          <p className="text-xl text-emerald-300 opacity-90">Celtic Stone Puzzle</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Stats */}
          <div className="space-y-4">
            <Card className="p-6 bg-stone-800/80 border-amber-600">
              <h3 className="text-2xl font-bold text-amber-300 mb-4">Scór</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-emerald-300">Score:</span>
                  <span className="text-amber-100 font-mono text-lg">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300">Level:</span>
                  <span className="text-amber-100 font-mono text-lg">{level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300">Lines:</span>
                  <span className="text-amber-100 font-mono text-lg">{linesCleared}</span>
                </div>
              </div>
            </Card>

            {currentPiece && (
              <Card className="p-6 bg-stone-800/80 border-amber-600">
                <h3 className="text-xl font-bold text-amber-300 mb-3">Current Piece</h3>
                <Badge className="mb-2 bg-emerald-700">{currentPiece.name}</Badge>
                <div className="flex justify-center">
                  <div className="grid gap-1">
                    {currentPiece.shape.map((row, y) => (
                      <div key={y} className="flex gap-1">
                        {row.map((cell, x) => (
                          <div
                            key={x}
                            className={`w-4 h-4 border ${cell ? 'border-stone-400' : 'border-transparent'} bg-transparent flex items-center justify-center`}
                          >
                            {cell ? <GaelicFace type={currentPiece.type} className="w-full h-full" /> : null}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Controls */}
            <Card className="p-6 bg-stone-800/80 border-amber-600">
              <h3 className="text-xl font-bold text-amber-300 mb-3">Controls</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Move Left</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  <span>Move Right</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4" />
                  <span>Soft Drop</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Rotate (↑ or Space)</span>
                </div>
                <div>
                  <span className="font-mono">P</span> - Pause
                </div>
              </div>
            </Card>
          </div>

          {/* Game Board */}
          <div className="flex flex-col items-center">
            <Card className="p-4 bg-stone-800/90 border-2 border-amber-600">
              <div className="bg-stone-900 p-2 border-2 border-stone-700">
                {renderBoard()}
              </div>
            </Card>

            {/* Game Controls */}
            <div className="mt-6 flex gap-4">
              {!isPlaying ? (
                <Button 
                  onClick={startNewGame}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-8 py-3 text-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {gameOver ? 'New Game' : 'Start Game'}
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="bg-amber-700 hover:bg-amber-600 text-white px-8 py-3 text-lg"
                >
                  {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="mt-4 grid grid-cols-3 gap-2 lg:hidden">
              <Button 
                onClick={() => movePiece(-1, 0)}
                className="bg-stone-700 hover:bg-stone-600"
                disabled={!isPlaying || isPaused || gameOver}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <Button 
                onClick={() => movePiece(0, 0, true)}
                className="bg-stone-700 hover:bg-stone-600"
                disabled={!isPlaying || isPaused || gameOver}
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
              <Button 
                onClick={() => movePiece(1, 0)}
                className="bg-stone-700 hover:bg-stone-600"
                disabled={!isPlaying || isPaused || gameOver}
              >
                <ArrowRight className="w-6 h-6" />
              </Button>
              <div></div>
              <Button 
                onClick={() => movePiece(0, 1)}
                className="bg-stone-700 hover:bg-stone-600"
                disabled={!isPlaying || isPaused || gameOver}
              >
                <ArrowDown className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Game Status */}
          <div className="space-y-4">
            {gameOver && (
              <Card className="p-6 bg-red-900/80 border-red-600">
                <h3 className="text-2xl font-bold text-red-300 mb-2">Game Over!</h3>
                <p className="text-red-100">The ancient stones have fallen...</p>
                <p className="text-red-200 mt-2">Final Score: {score.toLocaleString()}</p>
              </Card>
            )}

            {isPaused && isPlaying && (
              <Card className="p-6 bg-amber-900/80 border-amber-600">
                <h3 className="text-2xl font-bold text-amber-300 mb-2">Paused</h3>
                <p className="text-amber-100">The ritual is on hold...</p>
              </Card>
            )}

            <Card className="p-6 bg-stone-800/80 border-amber-600">
              <h3 className="text-xl font-bold text-amber-300 mb-3">Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-emerald-500 border border-stone-400"></div>
                  <span>Spear - Swift and straight</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-amber-500 border border-stone-400"></div>
                  <span>Shield - Strong foundation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-500 border border-stone-400"></div>
                  <span>Triskele - Sacred symbol</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 border border-stone-400"></div>
                  <span>Serpent - Winding path</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 border border-stone-400"></div>
                  <span>Lightning - Storm's fury</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500 border border-stone-400"></div>
                  <span>Crook - Shepherd's tool</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-orange-500 border border-stone-400"></div>
                  <span>Flail - Harvest's end</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-emerald-300 opacity-75">
          <p>May the ancient stones guide your path to victory</p>
        </div>
      </div>
    </div>
  )
}

export default App