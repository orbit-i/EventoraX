import './RichTextEditor.css';

import { EditorContent } from '@tiptap/react';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    Link as LinkIcon,
    Image as ImageIcon,
    AlignLeft,
    AlignCenter
} from "lucide-react";

function RichTextEditor({ editor }) {

    return (
        <div className='rich-editor'>
            {/* Toolbar */}
            <div className='toolbar'>
                <button
                    onClick={() =>
                        editor.chain().focus().toggleBold().run()
                    }
                >
                    <Bold size={16} />
                </button>
                <button
                    onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                    }
                >
                    <Italic size={16} />
                </button>
                <button
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                >
                    <UnderlineIcon size={16} />
                </button>
                <button
                    onClick={() =>
                        editor.chain().focus().setTextAlign("left").run()
                    }
                >
                    <AlignLeft size={16} />
                </button>
                <button
                    onClick={() =>
                        editor.chain().focus().setTextAlign("center").run()
                    }
                >
                    <AlignCenter size={16} />
                </button>
                <button
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                >
                    <List size={16} />
                </button>
                <button>
                    <LinkIcon size={16} />
                </button>
                <button>
                    <ImageIcon size={16} />
                </button>
            </div>
            <EditorContent
                editor={editor}
                className='editor-content'
            />
        </div>
    )
}

export default RichTextEditor
