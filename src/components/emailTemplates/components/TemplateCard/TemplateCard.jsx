import { div } from 'three/src/nodes/math/OperatorNode.js'
import './TemplateCard.css'
import { useState } from 'react'

function TemplateCard() {

    const [selectedCard, setSelectedCard] = useState(0);
    return (
        <div className='templates-cards'>
            {/* card1 */}
            <div className={selectedCard === 0 ? 'template-card-container active' : 'template-card-container'}
                onClick={() => setSelectedCard(0)}
            >
                <div className='template-card-upper-content-container'>
                    <p className='welcome-email-para'>Welcome Email</p>
                    <div className='template-card-status-container'>
                        <p className='template-card-status'><span></span>Active</p>
                    </div>
                </div>
                <div className='template-card-lower-content-container'>
                    <p>Onboarding . 2 hours ago</p>
                </div>
            </div>
            {/* card 2 */}
            <div className={selectedCard === 1 ? 'template-card-container active' : 'template-card-container'}
                onClick={() => setSelectedCard(1)}
            >
                <div className='template-card-upper-content-container'>
                    <p className='welcome-email-para'>Welcome Email</p>
                    <div className='template-card-status-container'>
                        <p className='template-card-status'><span></span>Active</p>
                    </div>
                </div>
                <div className='template-card-lower-content-container'>
                    <p>Onboarding . 2 hours ago</p>
                </div>
            </div>
            {/* card 3 */}
            <div className={selectedCard === 2 ? 'template-card-container active' : 'template-card-container'}
                onClick={() => setSelectedCard(2)}
            >
                <div className='template-card-upper-content-container'>
                    <p className='welcome-email-para'>Welcome Email</p>
                    <div className='template-card-status-container'>
                        <p className='template-card-status'><span></span>Active</p>
                    </div>
                </div>
                <div className='template-card-lower-content-container'>
                    <p>Onboarding . 2 hours ago</p>
                </div>
            </div>
            {/* card 4 */}
            <div className={selectedCard === 3 ? 'template-card-container active' : 'template-card-container'}
                onClick={() => setSelectedCard(3)}
            >
                <div className='template-card-upper-content-container'>
                    <p className='welcome-email-para'>Welcome Email</p>
                    <div className='template-card-status-container'>
                        <p className='template-card-status'><span></span>Active</p>
                    </div>
                </div>
                <div className='template-card-lower-content-container'>
                    <p>Onboarding . 2 hours ago</p>
                </div>
            </div>
            {/* card 5 */}
            <div className={selectedCard === 4 ? 'template-card-container active' : 'template-card-container'}
                onClick={() => setSelectedCard(4)}
            >
                <div className='template-card-upper-content-container'>
                    <p className='welcome-email-para'>Welcome Email</p>
                    <div className='template-card-status-container'>
                        <p className='template-card-status'><span></span>Active</p>
                    </div>
                </div>
                <div className='template-card-lower-content-container'>
                    <p>Onboarding . 2 hours ago</p>
                </div>
            </div>
            {/* card 6 */}
            <div className={selectedCard === 5 ? 'template-card-container active' : 'template-card-container'}
                onClick={() => setSelectedCard(5)}
            >
                <div className='template-card-upper-content-container'>
                    <p className='welcome-email-para'>Welcome Email</p>
                    <div className='template-card-status-container'>
                        <p className='template-card-status'><span></span>Active</p>
                    </div>
                </div>
                <div className='template-card-lower-content-container'>
                    <p>Onboarding . 2 hours ago</p>
                </div>
            </div>
        </div >
    )
}

export default TemplateCard
