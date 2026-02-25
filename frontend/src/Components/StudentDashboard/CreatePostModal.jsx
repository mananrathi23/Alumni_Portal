import { useState } from "react";
import { FaTimes } from "react-icons/fa";

const CreatePostModal = ({ onClose }) => {
  const [category, setCategory] = useState("Discussion");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handlePublish = () => {
    /* 🔴 BACKEND INTEGRATION (LATER)
       POST /api/forum/posts
       body: { category, title, content }
    */

    console.log({ category, title, content });

    onClose(); // close modal after publish
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

      {/* Modal Box */}
      <div className="bg-white w-full max-w-lg rounded-xl p-6 relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FaTimes />
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-800">
          Create New Post
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Share your thoughts, ask questions, or make announcements
        </p>

        {/* Form */}
        <div className="space-y-4 mt-5">

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option>Discussion</option>
              <option>Question</option>
              <option>Announcement</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              placeholder="Enter post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              rows="4"
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800"
          >
            Publish Post
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreatePostModal;