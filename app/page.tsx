"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Search, Upload, Music, Play, Heart, BarChart3, LogOut, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

import Image from "next/image"
import { formatDuration } from "@/lib/utils"
import axios from "axios"

interface CircularProgressProps {
  value: number
  label: string
  color: string
}

interface Song {
  id: string
  name: string
  album_name: string
  cover: string
  artists: string[]
  danceability: number
  energy: number
  liveness: number
  valence: number
  duration: number
  lyrics: string
}

function CircularProgress({ value, label, color }: CircularProgressProps) {
  const percentage = Math.round(value * 100)
  const circumference = 2 * Math.PI * 20
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center space-y-1">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="20" stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-700" />
          <circle
            cx="22"
            cy="22"
            r="20"
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white">{percentage}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 capitalize">{label}</span>
    </div>
  )
}

export default function MusicSearchInterface() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("song")
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    id: "",
    image: "/placeholder.svg?height=40&width=40",
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/me", {
          withCredentials: true
        })
        const data = res.data
        setUserData({
          name: data.name,
          username: data.id,
          id: data.id,
          image: data.image || "/placeholder.svg",
        })
        setIsAuthenticated(true)
      } catch (e) {
        console.log("No autenticado")
        console.error(e)
      }
    }

    fetchUserData()
  }, [])

  // Función para manejar el inicio de sesión
  const handleLogin = () => {
    window.location.href = "http://127.0.0.1:5000/login"
  }

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    await fetch("http://127.0.0.1:5000/logout", { credentials: "include" })
    setIsAuthenticated(false)
    window.location.reload()
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const response = await axios.get<Song[]>("http://127.0.0.1:5000/search", {
        params: {
          q: searchQuery,
          type: searchType,
        },
        headers: {
          Accept: "application/json",
        },
      })
      setFilteredSongs(response.data)
    } catch (error) {
      console.error("Error fetching songs:", error)
      setFilteredSongs([])
    }
  }

  const userId = "jUAN"

  const sendEvent = async (
      type: "searched" | "played" | "saved",
      payload: {
        user_id: string
        song_id: string
        timestamp: string
      }
  ) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/event/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Error al enviar evento:", err);
      } else {
        console.log(`Evento ${type} enviado con éxito`);
      }
    } catch (e) {
      console.error("Error en la red:", e);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    const mp3Files = files.filter((file) => file.type === "audio/mpeg" || file.name.endsWith(".mp3"))
    if (mp3Files.length > 0) {
      // Here you would handle the file upload and lyrics detection
      console.log("Uploaded MP3 files:", mp3Files)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Music className="w-6 h-6 text-cyan-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                SoundFinder
              </h1>
            </div>

            {/* Search Section */}
            <div className="flex items-center space-x-4 flex-1 max-w-2xl">
              <Tabs value={searchType} onValueChange={setSearchType} className="w-auto">
                <TabsList className="bg-gray-800 border-gray-700">
                  <TabsTrigger value="song" className="text-xs">
                    Song
                  </TabsTrigger>
                  <TabsTrigger value="artist" className="text-xs">
                    Artist
                  </TabsTrigger>
                  <TabsTrigger value="lyrics" className="text-xs">
                    Lyrics
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={`Search by ${searchType}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="pl-10 bg-gray-800 border-gray-700 focus:border-cyan-400 focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* Upload Button */}
            <div
              className={`relative ${isDragOver ? "bg-cyan-400/20" : "bg-gray-800"} border-2 border-dashed ${isDragOver ? "border-cyan-400" : "border-gray-600"} rounded-lg p-4 transition-all duration-300 hover:border-cyan-400 hover:bg-gray-700`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".mp3,audio/mpeg"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  console.log("Selected files:", files)
                }}
              />
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium">Upload MP3</span>
              </div>
            </div>

            {/* Login Button or User Profile */}
            {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full p-0 w-10 h-10">
                      <Avatar className="w-10 h-10 border-2 border-cyan-400">
                        <AvatarImage src={userData.image || "/placeholder.svg"} alt={userData.name} />
                        <AvatarFallback className="bg-gray-800 text-cyan-400">{userData.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
                    <div className="flex items-center justify-start p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm text-white">{userData.name}</p>
                        <p className="text-xs text-gray-400">@{userData.username}</p>
                      </div>
                    </div>
                    <DropdownMenuItem
                        onClick={() => setShowStats(true)}
                        className="cursor-pointer hover:bg-gray-700 hover:text-cyan-400"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Estadísticas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer hover:bg-gray-700 hover:text-cyan-400"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Button onClick={handleLogin} className="bg-green-600 hover:bg-green-700 text-white">
                  <User className="mr-2 h-4 w-4" />
                  Iniciar sesión
                </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredSongs.map((song) => (
            <Card
              key={song.id}
              className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-400/10 cursor-pointer group"
              onClick={() => setSelectedSong(song)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <Image
                      src={song.cover || "/placeholder.svg"}
                      alt={song.album_name}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                      {song.name}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">{song.artists}</p>
                    <p className="text-gray-500 text-xs truncate">{song.album_name}</p>
                    <Badge variant="secondary" className="mt-2 text-xs bg-gray-800 text-gray-300">
                      {formatDuration(song.duration)}
                    </Badge>
                  </div>
                </div>

                {/* Audio Features */}
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-800">
                  <CircularProgress value={song.danceability} label="dance" color="#06b6d4" />
                  <CircularProgress value={song.energy} label="energy" color="#f59e0b" />
                  <CircularProgress value={song.liveness} label="live" color="#10b981" />
                  <CircularProgress value={song.valence} label="mood" color="#8b5cf6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Song Detail Modal */}
      <Dialog open={!!selectedSong} onOpenChange={() => setSelectedSong(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 w-full !max-w-2xl overflow-auto">
          {selectedSong && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">Song Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 w-full">
                <div className="flex items-start space-x-6 flex-wrap">
                  <Image
                    src={selectedSong.cover || "/placeholder.svg"}
                    alt={selectedSong.album_name}
                    width={200}
                    height={200}
                    className="rounded-lg object-cover max-w-[200px] w-full"
                  />

                  <div className="flex-1 space-y-4 min-w-[200px]">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedSong.name}</h2>
                      <p className="text-lg text-cyan-400">{selectedSong.artists}</p>
                      <p className="text-gray-400">
                        {selectedSong.album_name}
                      </p>
                      <Badge className="mt-2 bg-purple-600 hover:bg-purple-700">selectedSong.popularity</Badge>
                    </div>

                    <div className="flex items-center space-x-4 flex-wrap">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Play className="w-4 h-4 mr-2" />
                        Play on Spotify
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-gray-700 hover:bg-gray-800 bg-transparent"
                        onClick={() =>
                            sendEvent("saved", {
                              user_id: userId,
                              song_id: selectedSong.id,
                              timestamp: new Date().toISOString(),
                            })
                        }
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      {/*<Button*/}
                      {/*  variant="outline"*/}
                      {/*  size="icon"*/}
                      {/*  className="border-gray-700 hover:bg-gray-800 bg-transparent"*/}
                      {/*>*/}
                      {/*  <Share2 className="w-4 h-4" />*/}
                      {/*</Button>*/}
                    </div>
                  </div>
                </div>

                {/* Audio Features Detail */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-gray-800 rounded-lg w-full">
                  <CircularProgress value={selectedSong.danceability} label="danceability" color="#06b6d4" />
                  <CircularProgress value={selectedSong.energy} label="energy" color="#f59e0b" />
                  <CircularProgress value={selectedSong.liveness} label="liveness" color="#10b981" />
                  <CircularProgress value={selectedSong.valence} label="valence" color="#8b5cf6" />
                </div>

                {/* Spotify Embed Placeholder */}
                <div className="bg-gray-800 rounded-lg p-6 text-center w-full">
                  <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-green-400">
                      <Music className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Spotify Player</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Spotify embed would appear here with track ID: {selectedSong.id}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Tus estadísticas de escucha</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <Search className="w-8 h-8 mx-auto text-cyan-400 mb-2" />
                    <h3 className="text-lg font-medium">Búsquedas</h3>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">247</p>
                  </div>
                  <Separator className="my-4 bg-gray-700" />
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Midnight Dreams</span>
                        <span className="text-cyan-400">42</span>
                      </div>
                      <Progress value={42} max={100} className="h-2 bg-gray-700" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Neon Lights</span>
                        <span className="text-cyan-400">36</span>
                      </div>
                      <Progress value={36} max={100} className="h-2 bg-gray-700" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Ocean Waves</span>
                        <span className="text-cyan-400">28</span>
                      </div>
                      <Progress value={28} max={100} className="h-2 bg-gray-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <Play className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                    <h3 className="text-lg font-medium">Reproducciones</h3>
                    <p className="text-3xl font-bold text-purple-400 mt-2">189</p>
                  </div>
                  <Separator className="my-4 bg-gray-700" />
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Electric Storm</span>
                        <span className="text-purple-400">53</span>
                      </div>
                      <Progress value={53} max={100} className="h-2 bg-gray-700" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Midnight Dreams</span>
                        <span className="text-purple-400">37</span>
                      </div>
                      <Progress value={37} max={100} className="h-2 bg-gray-700" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Urban Jungle</span>
                        <span className="text-purple-400">25</span>
                      </div>
                      <Progress value={25} max={100} className="h-2 bg-gray-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <Heart className="w-8 h-8 mx-auto text-pink-400 mb-2" />
                    <h3 className="text-lg font-medium">Guardados</h3>
                    <p className="text-3xl font-bold text-pink-400 mt-2">76</p>
                  </div>
                  <Separator className="my-4 bg-gray-700" />
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Starlight Serenade</span>
                        <span className="text-pink-400">18</span>
                      </div>
                      <Progress value={18} max={100} className="h-2 bg-gray-700" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Electric Storm</span>
                        <span className="text-pink-400">15</span>
                      </div>
                      <Progress value={15} max={100} className="h-2 bg-gray-700" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Neon Lights</span>
                        <span className="text-pink-400">12</span>
                      </div>
                      <Progress value={12} max={100} className="h-2 bg-gray-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Actividad reciente</h3>
                <div className="space-y-4">
                  {[
                    { action: "Búsqueda", song: "Midnight Dreams", time: "Hace 2 horas", icon: Search },
                    { action: "Reproducción", song: "Electric Storm", time: "Hace 3 horas", icon: Play },
                    { action: "Guardado", song: "Starlight Serenade", time: "Hace 5 horas", icon: Heart },
                    { action: "Búsqueda", song: "Urban Jungle", time: "Hace 1 día", icon: Search },
                    { action: "Reproducción", song: "Neon Lights", time: "Hace 1 día", icon: Play },
                  ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-700">
                        <div className="p-2 rounded-full bg-gray-700">
                          <item.icon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {item.action}: {item.song}
                          </p>
                          <p className="text-xs text-gray-400">{item.time}</p>
                        </div>
                      </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
