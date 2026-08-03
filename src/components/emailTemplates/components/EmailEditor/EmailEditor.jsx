import { Check, Copy, Delete, Trash } from 'lucide-react'
import './EmailEditor.css'
import RichTextEditor from '../RichTextEditor/RichTextEditor'


import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Variables from '../Variables/Variables';

function EmailEditor() {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            Image,
            TextAlign.configure({
                types: ["heading", "paragraph"]
            })
        ],
        content: `
         <p>Hi username,</p>

            <p>
                Welcome to EventoraX — the world's most powerful event
                management platform.
            </p>

            <ul>
                <li>Manage unlimited events</li>
                <li>Issue digital certificates</li>
                <li>Access real-time analytics</li>
                <li>Collaborate with your team</li>
            </ul>

            <p>
                Best Regards,<br/>
                The EventoraX Team
            </p>
        `
    });

    if (!editor) return null;
    return (
        <div className='email-editor-container'>
            <div className='email-editor-container-upper-section'>
                <div className='email-editor-upper-section-left-container'>
                    <p>Welcome Email</p>
                    <div className='email-editor-status-container'>
                        <p><span></span>Active</p>
                    </div>
                </div>
                <div className='email-editor-btns-container'>
                    <button>
                        <Trash size={12} />
                        Delete
                    </button>
                    <button>
                        <Copy size={12} />
                        Duplicate
                    </button>
                    <button className='editor-save-btn-container'>
                        <Check size={12} style={{ color: 'white' }} />
                        <p style={{ color: 'white' }}>Save</p>
                    </button>
                </div>
            </div>
            <div className='email-editor-main-section-container'>
                {/* container 1 */}
                <div>
                    <div className='email-editor-subject-line-container'>
                        <p>SUBJECT LINE</p>
                        <input type="text" value="Welcome to EventoraX, {{ username }}!" />
                    </div>
                    <RichTextEditor editor={editor} />
                </div>
                <div className='variable-layout'>
                    <Variables editor={editor} />
                </div>
            </div>
        </div>
    )
}

export default EmailEditor
