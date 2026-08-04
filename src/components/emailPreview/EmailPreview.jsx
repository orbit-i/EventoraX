import { ArrowLeft, Check, ChevronRight, Monitor, MoveLeft, Send, Smartphone, Zap } from 'lucide-react'
import AnalyticsSidebar from '../analytics/AnalyticsSidebar'
import EmailHeader from '../emailTemplates/EmailHeader'
import './EmailPreview.css'
import { useEffect, useState } from 'react'

function EmailPreview() {

    const [previewMode, setPreviewMode] = useState(0);
    return (
        <div>
            <AnalyticsSidebar header={<EmailHeader />} />
            <main>
                <div className='email-preview-upper-main-section'>
                    <div className='email-preview-upper-content-container'>
                        <p className='email-preview-first-para'>Super Admin</p>
                        <ChevronRight size={14} className='email-preview-chevron-right-icon' />
                        <p className='email-preview-first-para'>Email Templates</p>
                        <ChevronRight size={14} className='email-preview-chevron-right-icon' />
                        <p className='email-preview-second-para'>Preview</p>
                    </div>
                    <div className='email-preview-lower-content-container'>
                        <p className='email-preview-para'>Email Preview</p>
                        <div className='email-preview-lower-content-btns-container'>
                            <button className='email-preview-back-btn-container'>
                                <ArrowLeft size={14} />
                                Back
                            </button>
                            <button className='email-preview-save-btn-container'>
                                <Check size={14} />
                                Save
                            </button>
                            <button className='email-preview-send-test-btn-container'>
                                <Send size={14} />
                                Send Test
                            </button>
                        </div>
                    </div>
                    <div className='email-preview-main-content-container'>
                        <div className='email-preview-main-left-content-container'>
                            <div className='email-preview-main-left-first-content-container'>
                                <p className='email-preview-send-test-email-para'>
                                    <Send style={{ color: '#6c5ce7' }} size={12} />
                                    Send Test Email
                                </p>
                                <div className='email-preview-recipient-email-container'>
                                    <label htmlFor="recipient-email">Recipient Email</label>
                                    <input type="email" value="james@techcorp.io" name='recipient-email' />
                                </div>
                                <div className='email-test-subject-container'>
                                    <label htmlFor="email-test-subject">Subject</label>
                                    <input type="text" value="Welcome to EventoraX, James!" name='email-test-subject' />
                                </div>
                                <button className='email-send-test-btn-container'>
                                    <Send size={12} />
                                    Send Test
                                </button>
                            </div>
                            <div className='email-preview-main-left-second-content-container'>
                                <p className='preview-mode-para'>Preview Mode</p>
                                <div
                                    className={previewMode === 0 ? 'preview-mode-container active' : 'preview-mode-container'}
                                    onClick={() => setPreviewMode(0)}
                                >
                                    <div className='monitor-container'>
                                        <Monitor className='preview-icon' size={14} />
                                        <p className='preview-text'>Desktop</p>
                                    </div>
                                    <div>
                                        <Check className='show-icon' size={14} />
                                    </div>
                                </div>
                                <div className={previewMode === 1 ? 'preview-mode-container active' : 'preview-mode-container'}
                                    onClick={() => setPreviewMode(1)}
                                >
                                    <div className='smart-phone-container'>
                                        <Smartphone className='preview-icon' size={14} />
                                        <p className='preview-text'>Mobile</p>
                                    </div>
                                    <div>
                                        <Check className='show-icon' size={14} />
                                    </div>
                                </div>
                            </div>
                            <div className='email-preview-main-left-third-content-container'>
                                <p className='template-info-para'>Template Info</p>
                                <div className='template-info-container'>
                                    <p className='template-first-para-child'>Template</p>
                                    <p>Welcome Email</p>
                                </div>
                                <div className='template-info-container'>
                                    <p className='template-first-para-child'>Category</p>
                                    <p>Onboarding</p>
                                </div>
                                <div className='template-info-container'>
                                    <p className='template-first-para-child'>Last Edited</p>
                                    <p>2 hours ago</p>
                                </div>
                                <div className='template-info-container'>
                                    <p className='template-first-para-child'>Status</p>
                                    <div className='template-status-container'>
                                        <p><span></span>Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='email-preview-main-right-content-container'>
                            <div className='email-preview-main-right-upper-section'>
                                <div className='email-preview-main-right-upper-section-colors-container'>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <div className='welcome-email-preview-container'>
                                    <p>Email Preview — Welcome to EventoraX, James!</p>
                                </div>
                                <div className='email-preview-main-right-upper-btns-container'>
                                    <button>
                                        <Monitor size={12} />
                                        Desktop
                                    </button>
                                    <button>
                                        <Smartphone size={12} />
                                        Mobile
                                    </button>
                                </div>
                            </div>
                            <div className='eventorax-email-box'>
                                <div className='eventorax-email'>
                                    <div className='eventorax-upper-email-section'>
                                    <Zap />
                                    <p>EventoraX</p>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default EmailPreview
