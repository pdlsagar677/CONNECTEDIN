import React, { useRef, useState } from 'react'
import { X, ImagePlus, Loader2, Camera, Trash2, Eye, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { readFileAsDataURL } from '@/lib/utils'
import API from '@/lib/api'

interface CreateStoryProps {
  open: boolean
  setOpen: (open: boolean) => void
  onCreated: () => void
}

const CreateStory: React.FC<CreateStoryProps> = ({ open, setOpen, onCreated }) => {
  const imageRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const fileChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB")
        return
      }
      setFile(selected)
      const dataUrl = await readFileAsDataURL(selected)
      setPreview(dataUrl)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB")
        return
      }
      setFile(droppedFile)
      const dataUrl = await readFileAsDataURL(droppedFile)
      setPreview(dataUrl)
    } else {
      toast.error("Please drop an image file")
    }
  }

  const removeImage = () => {
    setFile(null)
    setPreview('')
    if (imageRef.current) {
      imageRef.current.value = ""
    }
  }

  const createHandler = async () => {
    if (!file) {
      toast.error("Please select an image for your story")
      return
    }
    
    const formData = new FormData()
    formData.append('image', file)
    formData.append('caption', caption)

    try {
      setLoading(true)
      const res = await API.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data.success) {
        toast.success('Story created successfully!')
        setOpen(false)
        onCreated()
        // Reset form
        setFile(null)
        setPreview('')
        setCaption('')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create story')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Create Story</h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <p className="text-white/80 text-xs mt-1">Share what's happening now</p>
        </div>

        <div className="p-6">
          {/* Image Upload Area */}
          {!preview ? (
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={imageRef}
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
                onChange={fileChangeHandler}
              />
              <div className="space-y-3">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <ImagePlus className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Upload a photo or video</p>
                  <p className="text-sm text-gray-500 mt-1">Drag and drop or click to browse</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Stories disappear after 24 hours</span>
                </div>
                <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                <img
                  src={preview}
                  alt="Story Preview"
                  className="w-full max-h-96 object-contain"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 rounded-full px-2 py-1">
                  <p className="text-white text-xs">Story Preview</p>
                </div>
              </div>

              {/* Caption Input */}
              <div className="relative">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption (optional)..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  rows={3}
                  maxLength={150}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {caption.length}/150
                </div>
              </div>

              {/* Story Tips */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-700">Story Tips</p>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✨ Stories are visible for 24 hours</li>
                  <li>📱 Best viewed on mobile devices</li>
                  <li>🎨 Add emojis to make your story engaging</li>
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {!preview ? (
              <button
                onClick={() => imageRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ImagePlus className="h-5 w-5" />
                Select Image
              </button>
            ) : (
              <>
                <button
                  onClick={removeImage}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                  Change
                </button>
                <button
                  onClick={createHandler}
                  disabled={loading}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    loading
                      ? 'bg-gray-200 cursor-not-allowed text-gray-500'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      Share Story
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Info Note */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Your story will disappear after 24 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add animations (add this to your global CSS or tailwind config)
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`;

// Add styles to head (you can add this to your main CSS file instead)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default CreateStory;