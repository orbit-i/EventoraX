import { CircleAlert, TriangleAlert, UserPlus, X } from 'lucide-react';
import '../styles/ImpersonateModal.css';

function ImpersonateModal({ setShowModal, selectedTenant }) {

  const shortName =
    selectedTenant?.orgName
      ?.split(" ")
      ?.map(word => word[0])
      ?.join("")
      ?.toUpperCase();

  return (
      <div className='impersonate-overlay'>
        <div className='impersonate-container'>
          <div className='impersonate-first-container'>
            <div className='triangle-alert-icon-container'>
              <TriangleAlert className='triangle-alert-icon' />
            </div>
            <div className='impersonate-x-icon-container'>
              <X
                onClick={() => {
                  setShowModal(false);
                }}
                className='impersonate-x-icon' />
            </div>
          </div>
          <div className='impersonate-second-container'>
            <div className='impersonate-second-inner-upper-container'>
              <p>Start Tenant Impersonation</p>
            </div>
            <div className='impersonate-second-inner-lower-container'>
              <p>You are about to access this tenant as administrator.</p>
            </div>
          </div>
          {/* tenant info container */}
          <div className='impersonate-tenant-info-container'>
            <div className='impersonate-tenant-info-left-container'>
              <div className='impersonate-tenant-short-name-container'>
                <p>{shortName}</p>
              </div>
              <div className='impersonate-tenant-name-email-container'>
                <p className='impersonate-tenant-name'>{selectedTenant.orgName}</p>
                <p className='impersonate-tenant-email'>{selectedTenant.email}</p>
              </div>
            </div>
            <div className='impersonate-tenant-info-right-container'>
              <p>{selectedTenant.plan}</p>
            </div>
          </div>
          <div className='tenant-info-last-container'>
            <div className='tenant-info-last-left-icon-container'>
              <CircleAlert className='tenant-info-circle-alert-container' />
            </div>
            <div className='tenant-info-last-right-content-container'>
              <p>All actions performed during this session will be logged in the audit trail and attributed to your super admin account.</p>
            </div>
          </div>
          <div className='impersonate-tenants-buttons'>
            <button
              onClick={() => {
                setShowModal(false);
              }}
              className='impersonate-cancel-btn'>Cancel</button>
            <div className='start-impersonate-button-container'>
              <UserPlus className='impersonate-user-plus-icon' />
              <button>Start Impersonation</button>
            </div>
          </div>
        </div>
      </div>
  )
}

export default ImpersonateModal