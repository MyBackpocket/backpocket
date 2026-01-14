"use client";

import {
  Bold,
  Check,
  ChevronDown,
  Code,
  Columns2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  Minimize2,
  Pencil,
  Pilcrow,
  Quote,
  Redo,
  RemoveFormatting,
  Strikethrough,
  Type,
  Undo,
} from "lucide-react";
import {
  EditorCommand,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  StarterKit,
} from "novel";
import { useCallback, useEffect, useRef, useState } from "react";
import TurndownService from "turndown";
import { useDebouncedCallback } from "use-debounce";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ============================================================================
// Markdown <-> HTML/JSON conversion utilities
// ============================================================================

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Add GFM support for strikethrough
turndownService.addRule("strikethrough", {
  filter: ["del", "s"],
  replacement: (content) => `~~${content}~~`,
});

/**
 * Convert HTML string to markdown
 */
function htmlToMarkdown(html: string): string {
  if (!html) return "";
  return turndownService.turndown(html);
}

/**
 * Convert markdown to HTML (simple conversion for loading into editor)
 * This is a simplified parser - the editor will handle proper formatting
 */
function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown
    // Escape HTML entities first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/__(.*?)__/gim, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/_(.*?)_/gim, "<em>$1</em>")
    // Strikethrough
    .replace(/~~(.*?)~~/gim, "<del>$1</del>")
    // Code blocks
    .replace(/```[\s\S]*?```/gim, (match) => {
      const code = match.slice(3, -3).replace(/^\w*\n/, "");
      return `<pre><code>${code}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/gim, "<code>$1</code>")
    // Blockquotes
    .replace(/^&gt; (.*$)/gim, "<blockquote>$1</blockquote>")
    // Unordered lists
    .replace(/^[-*] (.*$)/gim, "<li>$1</li>")
    // Ordered lists
    .replace(/^\d+\. (.*$)/gim, "<li>$1</li>")
    // Line breaks
    .replace(/\n/gim, "<br>");

  // Wrap consecutive list items
  html = html.replace(/(<li>.*?<\/li>)(\s*<br>)?(<li>)/gim, "$1$3");
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/gim, "<ul>$&</ul>");
  html = html.replace(/<\/li><li>/gim, "</li><li>");

  // Clean up multiple br tags
  html = html.replace(/(<br>)+/gim, "<br>");

  return html;
}

// ============================================================================
// Slash command suggestions
// ============================================================================

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (props: { editor: any; range: any }) => void;
}

const suggestionItems: CommandItem[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a bullet list",
    icon: <List className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    icon: <ListOrdered className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Quote",
    description: "Create a blockquote",
    icon: <Quote className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code",
    description: "Create a code block",
    icon: <Code className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
];

// ============================================================================
// Simple Textarea Mode with Preview
// ============================================================================

type MarkdownViewMode = "edit" | "preview" | "split";

interface SimpleNoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSwitchToRich: () => void;
  placeholder?: string;
  saveStatus?: "idle" | "saving" | "saved";
}

function SimpleNoteEditor({
  value,
  onChange,
  onSwitchToRich,
  placeholder = "Write your notes here...",
  saveStatus = "idle",
}: SimpleNoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewMode, setViewMode] = useState<MarkdownViewMode>("edit");

  // Auto-resize textarea on mount and when value changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
    }
  }, []);

  return (
    <div className="rounded-lg border bg-background shadow-sm">
      {/* Top bar with mode toggle and save status */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-2 py-1.5">
        <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs bg-background shadow-sm font-medium"
          >
            <Code className="h-3 w-3 mr-1.5" />
            Markdown
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSwitchToRich}
            className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50"
          >
            <Type className="h-3 w-3 mr-1.5" />
            Rich Text
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* View mode toolbar */}
      <div className="flex items-center gap-1 border-b bg-muted/20 px-2 py-1.5">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("edit")}
                className={cn(
                  "h-8 px-3 gap-1.5",
                  viewMode === "edit" && "bg-accent text-accent-foreground"
                )}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="text-xs">Edit</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Edit markdown</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("split")}
                className={cn(
                  "h-8 px-3 gap-1.5",
                  viewMode === "split" && "bg-accent text-accent-foreground"
                )}
              >
                <Columns2 className="h-3.5 w-3.5" />
                <span className="text-xs">Split</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Side-by-side edit and preview</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("preview")}
                className={cn(
                  "h-8 px-3 gap-1.5",
                  viewMode === "preview" && "bg-accent text-accent-foreground"
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="text-xs">Preview</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Preview rendered markdown</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Content area */}
      <div
        className={cn(
          "min-h-[200px]",
          viewMode === "split" &&
            "grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x"
        )}
      >
        {/* Editor pane */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div className={cn("relative", viewMode === "split" && "min-h-[200px]")}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                if (viewMode === "edit") {
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.max(200, e.target.scrollHeight)}px`;
                }
              }}
              placeholder={placeholder}
              className={cn(
                "w-full h-full bg-transparent px-4 py-3 outline-none resize-none",
                "font-mono text-sm",
                "placeholder:text-muted-foreground",
                "focus:bg-muted/10",
                viewMode === "edit" && "min-h-[200px]",
                viewMode === "split" && "absolute inset-0"
              )}
            />
          </div>
        )}

        {/* Preview pane */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={cn(
              "px-4 py-3 overflow-auto",
              viewMode === "split" && "bg-muted/10 min-h-[200px]",
              viewMode === "preview" && "min-h-[200px]"
            )}
          >
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-muted-foreground text-sm italic">
                Nothing to preview yet. Start writing some markdown!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
        Supports **bold**, *italic*, `code`, lists, headings, and more
      </div>
    </div>
  );
}

// ============================================================================
// Toolbar Button Component
// ============================================================================

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  shortcut?: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  tooltip,
  shortcut,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn("h-8 w-8 p-0", isActive && "bg-accent text-accent-foreground")}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>{tooltip}</span>
        {shortcut && (
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono">{shortcut}</kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// Rich Editor Mode
// ============================================================================

interface RichNoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSwitchToSimple: () => void;
  saveStatus?: "idle" | "saving" | "saved";
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}

function RichNoteEditor({
  value,
  onChange,
  onSwitchToSimple,
  saveStatus = "idle",
  isFullScreen,
  onToggleFullScreen,
}: RichNoteEditorProps) {
  const editorRef = useRef<any>(null);
  // Store initial value (only use on first render)
  const initialValueRef = useRef(value);
  const hasSetInitialContent = useRef(false);
  // Force re-render to update toolbar active states
  const [, forceUpdate] = useState(0);

  // Handle editor creation - set initial content from markdown
  const handleCreate = useCallback(({ editor }: { editor: any }) => {
    editorRef.current = editor;
    const initialValue = initialValueRef.current;
    if (initialValue && !hasSetInitialContent.current) {
      hasSetInitialContent.current = true;
      // Convert markdown to HTML and let Tiptap parse it
      const html = markdownToHtml(initialValue);
      editor.commands.setContent(html);
    }
  }, []);

  // Handle editor updates - convert to markdown and notify parent
  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      editorRef.current = editor;
      // Skip update during initial content setting
      if (!hasSetInitialContent.current && initialValueRef.current) return;
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onChange(markdown);
    },
    [onChange]
  );

  // Handle selection change to update toolbar states
  const handleSelectionUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  const editor = editorRef.current;

  // Get current text style for dropdown
  const getCurrentTextStyle = () => {
    if (!editor) return "Paragraph";
    if (editor.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor.isActive("heading", { level: 3 })) return "Heading 3";
    return "Paragraph";
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "relative rounded-lg border bg-background shadow-sm",
          isFullScreen &&
            "fixed inset-0 z-100 p-6 overflow-auto flex flex-col rounded-none border-0"
        )}
      >
        {/* Top bar with mode toggle and save status */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-2 py-1.5">
          <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSwitchToSimple}
              className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50"
            >
              <Code className="h-3 w-3 mr-1.5" />
              Markdown
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs bg-background shadow-sm font-medium"
            >
              <Type className="h-3 w-3 mr-1.5" />
              Rich Text
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleFullScreen}
              className="h-7 w-7 p-0"
            >
              {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Google Docs-style Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/20 px-2 py-1.5">
          {/* Undo / Redo */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            tooltip="Undo"
            shortcut="⌘Z"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            tooltip="Redo"
            shortcut="⌘⇧Z"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Text Style Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1 min-w-[100px] justify-between font-normal"
              >
                <span className="truncate">{getCurrentTextStyle()}</span>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[160px]">
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().setParagraph().run()}
                className={cn(editor?.isActive("paragraph") && "bg-accent")}
              >
                <Pilcrow className="h-4 w-4 mr-2" />
                Paragraph
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(editor?.isActive("heading", { level: 1 }) && "bg-accent")}
              >
                <Heading1 className="h-4 w-4 mr-2" />
                <span className="text-lg font-bold">Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(editor?.isActive("heading", { level: 2 }) && "bg-accent")}
              >
                <Heading2 className="h-4 w-4 mr-2" />
                <span className="text-base font-bold">Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                className={cn(editor?.isActive("heading", { level: 3 }) && "bg-accent")}
              >
                <Heading3 className="h-4 w-4 mr-2" />
                <span className="text-sm font-bold">Heading 3</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={editor?.isActive("bold")}
            tooltip="Bold"
            shortcut="⌘B"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={editor?.isActive("italic")}
            tooltip="Italic"
            shortcut="⌘I"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            isActive={editor?.isActive("strike")}
            tooltip="Strikethrough"
            shortcut="⌘⇧X"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCode().run()}
            isActive={editor?.isActive("code")}
            tooltip="Inline code"
            shortcut="⌘E"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={editor?.isActive("bulletList")}
            tooltip="Bullet list"
            shortcut="⌘⇧8"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={editor?.isActive("orderedList")}
            tooltip="Numbered list"
            shortcut="⌘⇧7"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Block Formatting */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            isActive={editor?.isActive("blockquote")}
            tooltip="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            isActive={editor?.isActive("codeBlock")}
            tooltip="Code block"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Clear Formatting */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            tooltip="Clear formatting"
          >
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Editor */}
        <EditorRoot>
          <EditorContent
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onSelectionUpdate={handleSelectionUpdate}
            className={cn(
              "prose prose-neutral dark:prose-invert max-w-none",
              "bg-background px-4 py-3",
              "min-h-[250px]",
              "[&_.tiptap]:outline-none [&_.tiptap]:min-h-[200px]",
              "[&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground",
              "[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
              "[&_.tiptap_p.is-editor-empty:first-child::before]:float-left",
              "[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none",
              "[&_.tiptap_p.is-editor-empty:first-child::before]:h-0",
              isFullScreen && "flex-1"
            )}
            extensions={[StarterKit]}
          >
            {/* Slash command menu (keep as power-user feature) */}
            <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border bg-popover px-1 py-2 shadow-md">
              <EditorCommandList>
                {suggestionItems.map((item) => (
                  <EditorCommandItem
                    key={item.title}
                    value={item.title}
                    onCommand={(val) => item.command(val)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </EditorCommandItem>
                ))}
              </EditorCommandList>
            </EditorCommand>
          </EditorContent>
        </EditorRoot>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
          <span>
            Type <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">/</kbd> for
            commands
          </span>
          {isFullScreen && (
            <span>
              Press <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">Esc</kbd> to
              exit
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// Main NoteEditor Component
// ============================================================================

const EDITOR_MODE_STORAGE_KEY = "backpocket-note-editor-mode";

export interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export function NoteEditor({
  value,
  onChange,
  onSave,
  placeholder,
  autoSave = true,
  autoSaveDelay = 1000,
}: NoteEditorProps) {
  const [isRichMode, setIsRichMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(EDITOR_MODE_STORAGE_KEY) === "rich";
    }
    return false;
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Persist editor mode preference
  useEffect(() => {
    localStorage.setItem(EDITOR_MODE_STORAGE_KEY, isRichMode ? "rich" : "simple");
  }, [isRichMode]);

  // Handle escape key for full screen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  // Lock body scroll when in full screen mode
  useEffect(() => {
    if (isFullScreen) {
      // Save current scroll position and lock body
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";

      return () => {
        // Restore scroll position when exiting full screen
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isFullScreen]);

  // Track the last saved value to detect actual changes
  const lastSavedValueRef = useRef(value);

  // Update ref when prop changes (external save completed)
  useEffect(() => {
    lastSavedValueRef.current = value;
  }, [value]);

  // Debounced save - only triggers after user stops typing
  const debouncedSave = useDebouncedCallback((newValue: string) => {
    // Only save if value actually changed from last saved
    if (newValue !== lastSavedValueRef.current) {
      onChange(newValue);
      if (onSave) {
        onSave();
      }
      lastSavedValueRef.current = newValue;
      // Show "saved" status briefly
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      // No actual change, just reset status
      setSaveStatus("idle");
    }
  }, autoSaveDelay);

  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      if (autoSave) {
        // Only show "saving" if there's an actual change pending
        if (newValue !== lastSavedValueRef.current) {
          setSaveStatus("saving");
        }
        debouncedSave(newValue);
      } else {
        onChange(newValue);
      }
    },
    [autoSave, debouncedSave, onChange]
  );

  if (isRichMode) {
    return (
      <RichNoteEditor
        value={localValue}
        onChange={handleChange}
        onSwitchToSimple={() => setIsRichMode(false)}
        saveStatus={saveStatus}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
      />
    );
  }

  return (
    <SimpleNoteEditor
      value={localValue}
      onChange={handleChange}
      onSwitchToRich={() => setIsRichMode(true)}
      placeholder={placeholder}
      saveStatus={saveStatus}
    />
  );
}
