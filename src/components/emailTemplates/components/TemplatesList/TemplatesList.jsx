import { Search } from 'lucide-react';
import './TemplatesList.css';
import TemplateCard from '../TemplateCard/TemplateCard';

function TemplatesList() {
    return (
        <div className='templates-list-container'>
            <div className='templates-list-input-container'>
                <div>
                    <Search size={14} />
                </div>
                <input type="text" placeholder='Search templates...' />
            </div>
            <div className='templates-list-option-container'>
                <button>All</button>
                <button>Onboarding</button>
                <button>Security</button>
                <button>Billing</button>
                <button>Events</button>
            </div>
            <TemplateCard />
        </div>
    )
}

export default TemplatesList
