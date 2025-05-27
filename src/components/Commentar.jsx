import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  getDocs,
  addDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase-comment';
import {
  MessageCircle,
  UserCircle2,
  Loader2,
  AlertCircle,
  Send,
  ImagePlus,
  X,
} from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const SECRET_PASSWORD = 'shashank';//Change Password 

const Comment = memo(({ comment, formatDate }) => (
  <div className="px-4 pt-4 pb-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group hover:shadow-lg hover:-translate-y-0.5">
    <div className="flex items-start gap-3 ">
      {comment.profileImage ? (
        <img
          src={comment.profileImage}
          alt={`${comment.userName}'s profile`}
          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/30"
          loading="lazy"
        />
      ) : (
        <div className="p-2 rounded-full bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
          <UserCircle2 className="w-5 h-5" />
        </div>
      )}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h4 className="font-medium text-white truncate">{comment.userName}</h4>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <p className="text-gray-300 text-sm break-words leading-relaxed relative bottom-2">
          {comment.content}
        </p>
      </div>
    </div>
  </div>
));

const CommentForm = memo(({ onSubmit, isSubmitting }) => {
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleTextareaChange = useCallback((e) => {
    setNewComment(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!newComment.trim() || !userName.trim()) return;
      onSubmit({ newComment, userName, imageFile });
      setNewComment('');
      setImagePreview(null);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    },
    [newComment, userName, imageFile, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          ref={textareaRef}
          value={newComment}
          onChange={handleTextareaChange}
          placeholder="Write your message here..."
          className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none resize-none min-h-[120px]"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Profile Photo <span className="text-gray-400">(optional)</span>
        </label>
        <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
          {imagePreview ? (
            <div className="flex items-center gap-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/50"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-full"
              >
                <X className="w-4 h-4 inline-block mr-1" /> Remove
              </button>
            </div>
          ) : (
            <div className="w-full">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-dashed border-indigo-500/50"
              >
                <ImagePlus className="w-5 h-5" /> Choose Photo
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" /> Posting...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Post Comment
          </span>
        )}
      </button>
    </form>
  );
});

const Komentar = () => {
  const [comments, setComments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    AOS.init({ once: false, duration: 1000 });
  }, []);

  useEffect(() => {
    const commentsRef = collection(db, 'portfolio-comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const commentsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentsData);
    });
  }, []);

  const uploadImage = useCallback(async (imageFile) => {
    if (!imageFile) return null;
    const storageRef = ref(storage, `profile-images/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    return getDownloadURL(storageRef);
  }, []);

  const handleCommentSubmit = useCallback(async ({ newComment, userName, imageFile }) => {
    setError('');
    setIsSubmitting(true);
    try {
      const profileImageUrl = await uploadImage(imageFile);
      await addDoc(collection(db, 'portfolio-comments'), {
        content: newComment,
        userName,
        profileImage: profileImageUrl,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      setError('Failed to post comment.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [uploadImage]);

  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    }).format(date);
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-white/10 text-white space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-indigo-400" />
        <h3 className="text-xl font-semibold">Comments <span className="text-indigo-400">({isAuthorized ? comments.length : 'Private'})</span></h3>
      </div>

      <CommentForm onSubmit={handleCommentSubmit} isSubmitting={isSubmitting} />

      {!isAuthorized ? (
        <div className="space-y-2">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter password to view comments"
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
          />
          <button
            onClick={() => {
              if (passwordInput === SECRET_PASSWORD) setIsAuthorized(true);
              else alert('Incorrect password');
            }}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          >
            Show Comments
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
          {comments.length === 0 ? (
            <p className="text-center text-gray-400">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <Comment key={comment.id} comment={comment} formatDate={formatDate} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Komentar;
