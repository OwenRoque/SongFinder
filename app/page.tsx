"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Search, Upload, Music, Play, Heart, Share2, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"

// Mock data for songs
const mockSongs = [
  {
    id: 1,
    name: "Midnight Dreams",
    artist: "Luna Eclipse",
    album: "Nocturnal Vibes",
    duration: "3:42",
    cover: "/placeholder.svg?height=300&width=300",
    danceability: 0.75,
    energy: 0.68,
    liveness: 0.23,
    valence: 0.82,
    spotifyId: "4iV5W9uYEdYUVa79Axb7Rh",
    releaseDate: "2023",
    genre: "Electronic Pop",
  },
  {
    id: 2,
    name: "Neon Lights",
    artist: "Cyber Wave",
    album: "Digital Dreams",
    duration: "4:15",
    cover: "/placeholder.svg?height=300&width=300",
    danceability: 0.89,
    energy: 0.91,
    liveness: 0.15,
    valence: 0.76,
    spotifyId: "4iV5W9uYEdYUVa79Axb7Rh",
    releaseDate: "2023",
    genre: "Synthwave",
  },
  {
    id: 3,
    name: "Ocean Waves",
    artist: "Serene Sounds",
    album: "Nature's Symphony",
    duration: "5:28",
    cover: "/placeholder.svg?height=300&width=300",
    danceability: 0.34,
    energy: 0.28,
    liveness: 0.67,
    valence: 0.45,
    spotifyId: "4iV5W9uYEdYUVa79Axb7Rh",
    releaseDate: "2022",
    genre: "Ambient",
  },
  {
    id: 4,
    name: "Electric Storm",
    artist: "Thunder Beats",
    album: "Storm Chaser",
    duration: "3:56",
    cover: "/placeholder.svg?height=300&width=300",
    danceability: 0.67,
    energy: 0.94,
    liveness: 0.45,
    valence: 0.58,
    spotifyId: "4iV5W9uYEdYUVa79Axb7Rh",
    releaseDate: "2023",
    genre: "Electronic Rock",
  },
  {
    id: 5,
    name: "Starlight Serenade",
    artist: "Cosmic Melody",
    album: "Galactic Journey",
    duration: "4:33",
    cover: "/placeholder.svg?height=300&width=300",
    danceability: 0.56,
    energy: 0.72,
    liveness: 0.31,
    valence: 0.89,
    spotifyId: "4iV5W9uYEdYUVa79Axb7Rh",
    releaseDate: "2023",
    genre: "Space Pop",
  },
  {
    id: 6,
    name: "Urban Jungle",
    artist: "City Vibes",
    album: "Metropolitan",
    duration: "3:21",
    cover: "/placeholder.svg?height=300&width=300",
    danceability: 0.78,
    energy: 0.85,
    liveness: 0.52,
    valence: 0.71,
    spotifyId: "4iV5W9uYEdYUVa79Axb7Rh",
    releaseDate: "2023",
    genre: "Urban Pop",
  },
]

interface CircularProgressProps {
  value: number
  label: string
  color: string
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
  const [selectedSong, setSelectedSong] = useState<(typeof mockSongs)[0] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isDragOver, setIsDragOver] = useState(false)
  const songsPerPage = 6

  const filteredSongs = mockSongs.filter((song) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    switch (searchType) {
      case "song":
        return song.name.toLowerCase().includes(query)
      case "artist":
        return song.artist.toLowerCase().includes(query)
      case "album":
        return song.album.toLowerCase().includes(query)
      default:
        return (
          song.name.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          song.album.toLowerCase().includes(query)
        )
    }
  })

  const totalPages = Math.ceil(filteredSongs.length / songsPerPage)
  const startIndex = (currentPage - 1) * songsPerPage
  const currentSongs = filteredSongs.slice(startIndex, startIndex + songsPerPage)

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
                  <TabsTrigger value="album" className="text-xs">
                    Album
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={`Search by ${searchType}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentSongs.map((song) => (
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
                      alt={song.album}
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
                    <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                    <p className="text-gray-500 text-xs truncate">{song.album}</p>
                    <Badge variant="secondary" className="mt-2 text-xs bg-gray-800 text-gray-300">
                      {song.duration}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                className={
                  currentPage === page
                    ? "bg-cyan-400 text-gray-900 hover:bg-cyan-300"
                    : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                }
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              Next
            </Button>
          </div>
        )}
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
                    alt={selectedSong.album}
                    width={200}
                    height={200}
                    className="rounded-lg object-cover max-w-[200px] w-full"
                  />

                  <div className="flex-1 space-y-4 min-w-[200px]">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedSong.name}</h2>
                      <p className="text-lg text-cyan-400">{selectedSong.artist}</p>
                      <p className="text-gray-400">
                        {selectedSong.album} • {selectedSong.releaseDate}
                      </p>
                      <Badge className="mt-2 bg-purple-600 hover:bg-purple-700">{selectedSong.genre}</Badge>
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
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-gray-700 hover:bg-gray-800 bg-transparent"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-gray-700 hover:bg-gray-800 bg-transparent"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem>Add to Playlist</DropdownMenuItem>
                          <DropdownMenuItem>View Artist</DropdownMenuItem>
                          <DropdownMenuItem>View Album</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                    Spotify embed would appear here with track ID: {selectedSong.spotifyId}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
