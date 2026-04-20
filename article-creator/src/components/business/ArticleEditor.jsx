import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, memo } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

const MenuBar = ({ editor }) => {
  if (!editor) return null;
  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded ${editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded ${editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1 rounded ${editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1 rounded ${editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <Heading2 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 rounded ${editor.isActive("bulletList") ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 rounded ${editor.isActive("orderedList") ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <ListOrdered size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1 rounded ${editor.isActive("blockquote") ? "bg-gray-200" : "hover:bg-gray-100"}`}
      >
        <Quote size={18} />
      </button>
    </div>
  );
};

const ArticleEditor = ({ article, onUpdate }) => {
  console.log("ArticleEditor 渲染，article.id:", article?.id, "content 长度:", article?.content?.length);
  const content = article?.content || "";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "开始写作..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate({ content: editor.getHTML() });
      }
    },
  });

  useEffect(() => {
     console.log("ArticleEditor useEffect 触发，content:", content?.substring(0, 50));
    if (editor && !editor.isDestroyed) {
       console.log("准备执行 setContent");
      // 延迟确保编辑器已完全初始化
      const timer = setTimeout(() => {
        if (!editor.isDestroyed) {
          editor.commands.setContent(content, false);
            console.log("setContent 执行完毕");
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
    console.log("editor 不可用", { editor: !!editor, isDestroyed: editor?.isDestroyed });
  }
  }, [editor, content]);

  if (!editor)
    return (
      <div className="border border-gray-200 rounded-lg p-4 text-gray-500">
        加载编辑器...
      </div>
    );

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[400px]"
      />
    </div>
  );
};

export default memo(ArticleEditor);
