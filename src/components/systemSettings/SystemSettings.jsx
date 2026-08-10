import { Check, ChevronRight, ChevronUp, HardDrive, Layers, Lock, Mail, RefreshCcw, Settings, Shield, Wrench, Zap } from 'lucide-react'
import AnalyticsSidebar from '../analytics/AnalyticsSidebar'
import './SystemSettings.css'
import SystemSettingsHeader from './SystemSettingsHeader'
import { useState } from 'react'

function SystemSettings() {

    const [emailToggle, setEmailToggle] = useState(0);
    return (
        <div>
            <AnalyticsSidebar header={<SystemSettingsHeader />} />
            <main>
                <div className='super-admin-main-upper-section'>
                    <div className='super-admin-main-upper-section-first-container'>
                        <p>Super Admin</p>
                        <ChevronRight className='system-settings-chevron-right-icon' size={14} />
                        <p>System Settings</p>
                    </div>
                    <div className='super-admin-main-upper-section-second-container'>
                        <p>System Settings</p>
                        <div className='system-settings-btns-container'>
                            <button className='system-settings-reset-changes-btn'>
                                <RefreshCcw size={14} />
                                Reset Changes
                            </button>
                            <button className='system-settings-save-all-changes-btn'>
                                <Check size={14} />
                                Save All Changes
                            </button>
                        </div>
                    </div>
                </div>
                <div className='system-settings-main-section'>
                    <div className='system-settings-sidebar-container'>
                        <div className='system-settings'>
                            <Settings size={14} />
                            <p>General</p>
                        </div>
                        <div className='system-settings'>
                            <Mail size={14} />
                            <p>Email</p>
                        </div>
                        <div className='system-settings'>
                            <Shield size={14} />
                            <p>Security</p>
                        </div>
                        <div className='system-settings'>
                            <Lock size={14} />
                            <p>Authentication</p>
                        </div>
                        <div className='system-settings'>
                            <HardDrive size={14} />
                            <p>Storage</p>
                        </div>
                        <div className='system-settings'>
                            <Zap size={14} />
                            <p>API Keys</p>
                        </div>
                        <div className='system-settings'>
                            <Layers size={14} />
                            <p>Branding</p>
                        </div>
                        <div className='system-settings'>
                            <Wrench size={14} />
                            <p>Maintenance</p>
                        </div>
                    </div>
                    <div className='system-settings-main-content-container'>
                        <div className='general-settings-container'>
                            <div className='general-settings-upper-section'>
                                <div className='general-settings-upper-section-left-content'>
                                    <Settings style={{ color: '#6c5ce7' }} size={14} />
                                    <p>General Settings</p>
                                </div>
                                <div>
                                    <ChevronUp size={14} />
                                </div>
                            </div>
                            {/* Container 1 */}
                            <div className='platform-name-container'>
                                <div className='platform-name-left-content-container'>
                                    <p>Platform Name</p>
                                    <p>Displayed throughout the admin panel</p>
                                </div>
                                <div className='platform-name-input-container'>
                                    <input type="text" value="EventoraX" contentEditable />
                                </div>
                            </div>
                            {/* Container 2 */}
                            <div className='admin-email-container'>
                                <div className='admin-email-left-content-container'>
                                    <p>Admin Email</p>
                                    <p>Receives system alerts and notifications</p>
                                </div>
                                <div className='admin-email-input-container'>
                                    <input type="text" value="admin@eventoraX.com" contentEditable />
                                </div>
                            </div>
                            {/* Container 3 */}
                            <div className='time-zone-container'>
                                <div className='time-zone-left-content-container'>
                                    <p>Timezone</p>
                                    <p>Default timezone for all platform operations</p>
                                </div>
                                <div className='time-zone-input-container'>
                                    <select name="time-zone" id="time-zone">
                                        <option value="UTC (GMT + 0)">UTC (GMT + 0)</option>
                                        <option value="Eastern Time (GMT-5)">Eastern Time (GMT-5)</option>
                                        <option value="Pacific Time (GMT-8)">Pacific Time (GMT-8)</option>
                                    </select>
                                </div>
                            </div>
                            {/* Container 4 */}
                            <div className='language-container'>
                                <div className='language-left-content-container'>
                                    <p>Language</p>
                                </div>
                                <div className='language-input-container'>
                                    <select name="language" id="language">
                                        <option value="English (US)">English (US)</option>
                                        <option value="Spanish">Spanish</option>
                                        <option value="French">French</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className='email-configuration-container'>
                            <div className='email-configuration-upper-section'>
                                <div className='email-configuration-left-content-container'>
                                    <Mail size={14} style={{ color: '#6c5ce7' }} />
                                    <p>Email Configuration</p>
                                </div>
                                <div className='email-configuration-chevron-up-icon-container'>
                                    <ChevronUp size={14} />
                                </div>
                            </div>
                            <div className='smtp-host-container'>
                                <div className='smtp-host-left-content-container'>
                                    <p>SMTP</p>
                                    <p>Mail server hostname</p>
                                </div>
                                <div className='smtp-host-input-container'>
                                    <input type="text" value='smtp.eventoraX.com' contentEditable />
                                </div>
                            </div>
                            <div className='smtp-port-container'>
                                <div className='smtp-port-left-content-container'>
                                    <p>SMTP Port</p>
                                </div>
                                <div className='smtp-port-input-container'>
                                    <input type="text" value='587' contentEditable />
                                </div>
                            </div>
                            <div className='from-name-container'>
                                <div className='from-name-left-content-container'>
                                    <p>From Name</p>
                                </div>
                                <div className='from-name-input-container'>
                                    <input type="text" value='EventoraX Platform' />
                                </div>
                            </div>
                            <div className='email-notifications-container'>
                                <div className='email-notifications-left-content-container'>
                                    <p>Email Notifications</p>
                                    <p>Send automated email alerts</p>
                                </div>
                                <div className='email-notification-toggle-container'>
                                    <div className='email-notifications-outer-boundary-container'>
                                        <div className={`email-notifications-inner-boundary-container ${emailToggle ? 'toggle-on-email-notification' : ''
                                            }`}
                                            onClick={() => setEmailToggle(prev => !prev)}
                                        ></div>
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

export default SystemSettings
