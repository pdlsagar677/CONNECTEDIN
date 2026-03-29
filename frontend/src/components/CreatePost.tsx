import React, { useRef, useState } from 'react';
import { Loader2, ImagePlus, X, Smile, MapPin, Tag, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { setPosts } from '../redux/postSlice';
import { readFileAsDataURL } from '../lib/utils';
import { RootState } from '@/redux/store';
import API from '@/lib/api';

interface CreatePostProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreatePost: React.FC<CreatePostProps> = ({ open, setOpen }) => {
  const imageRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { user } = useSelector((store: RootState) => store.auth);
  const posts = useSelector((store: RootState) => store.post?.posts || []);
  const dispatch = useDispatch();

  const fileChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB");
        return;
      }
      setFile(selectedFile);
      const dataUrl = await readFileAsDataURL(selectedFile);
      setImagePreview(dataUrl);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB");
        return;
      }
      setFile(droppedFile);
      const dataUrl = await readFileAsDataURL(droppedFile);
      setImagePreview(dataUrl);
    } else {
      toast.error("Please drop an image file");
    }
  };

  const removeImage = () => {
    setFile(null);
    setImagePreview("");
    if (imageRef.current) {
      imageRef.current.value = "";
    }
  };

  const createPostHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file && !caption) {
      toast.error("Please add an image or caption");
      return;
    }
    
    const formData = new FormData();
    formData.append("caption", caption);
    if (location) formData.append("location", location);
    if (tags) formData.append("tags", tags);
    if (file) formData.append("image", file);

    try {
      setLoading(true);
      const res = await API.post('/post/addpost', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      });

      if (res.data.success) {
        dispatch(setPosts([res.data.post, ...posts]));
        toast.success("Post created successfully!");
        setOpen(false);
        setFile(null);
        setCaption("");
        setLocation("");
        setTags("");
        setImagePreview("");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-gray-900/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            Create New Post
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden ring-2 ring-blue-500/20">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-white font-semibold text-lg">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">{user?.username || 'Guest'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Share your moment with the world</p>
            </div>
          </div>

          {/* Image Upload Area */}
          {!imagePreview ? (
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 bg-gray-50 dark:bg-gray-950'
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
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <ImagePlus className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-200 font-medium">Drag and drop your image here</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to browse</p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-96 object-contain"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <Trash2 className="h-4 w-4 text-white" />
              </button>
            </div>
          )}

          {/* Caption Field */}
          <div className="space-y-4 mt-6">
            <div className="relative">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Write a caption..."
                rows={3}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
                {caption.length}/2200
              </div>
            </div>

            {/* Location Field */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add location"
              />
            </div>

            {/* Tags Field */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add tags (separate with commas)"
              />
            </div>

            {/* Preview Card */}
            {(caption || location || tags) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-700">Post Preview</p>
                </div>
                <div className="space-y-1 text-sm">
                  {caption && <p className="text-gray-700 dark:text-gray-200">{caption}</p>}
                  {location && (
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <MapPin className="h-3 w-3" />
                      <span>{location}</span>
                    </div>
                  )}
                  {tags && (
                    <div className="flex flex-wrap gap-1">
                      {tags.split(',').map((tag, idx) => (
                        <span key={idx} className="text-blue-600">#{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => imageRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-medium transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
              {imagePreview ? 'Change Image' : 'Add Image'}
            </button>

            <button
              onClick={createPostHandler}
              disabled={loading || (!file && !caption)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 ${
                loading || (!file && !caption)
                  ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Posting...
                </>
              ) : (
                'Share Post'
              )}
            </button>
          </div>

          {/* Tips */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              💡 Tip: Add a location and tags to reach more people!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add this to your global CSS or tailwind config
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

export default CreatePost;