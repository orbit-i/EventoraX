// All email HTML templates for EventoraX

// Welcome Email
export const welcomeTemplate = (name, orgName) => ({
    subject: `Welcome to ${orgName}!`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">EventoraX</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
            <h2>Welcome, ${name}!</h2>
            <p>You have successfully joined <strong>${orgName}</strong> on EventoraX.</p>
            <p>You can now manage events, registrations, and more.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.APP_URL || 'http://localhost:5173'}" 
                   style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px;">
                    Get Started
                </a>
            </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #999;">
            <p>EventoraX — Event Management Platform</p>
        </div>
    </div>
    `
});

// Registration Confirmation Email
export const registrationTemplate = (name, eventTitle, eventDate, refNo, ticketUrl) => ({
    subject: `Registration Confirmed — ${eventTitle}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">EventoraX</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
            <h2>Registration Confirmed!</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your registration for <strong>${eventTitle}</strong> has been confirmed.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Registration Details</h3>
                <p><strong>Event:</strong> ${eventTitle}</p>
                <p><strong>Date:</strong> ${eventDate}</p>
                <p><strong>Reference No:</strong> ${refNo}</p>
            </div>

            <p>Please keep your reference number for future use.</p>
        </div>
        <div style="padding: 20px; text-align: center; color: #999;">
            <p>EventoraX — Event Management Platform</p>
        </div>
    </div>
    `
});

// Certificate Email
export const certificateTemplate = (name, eventTitle, verifyCode, verifyUrl) => ({
    subject: `Your Certificate — ${eventTitle}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">EventoraX</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
            <h2>Congratulations, ${name}!</h2>
            <p>Your certificate of participation for <strong>${eventTitle}</strong> is ready.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; 
                        text-align: center;">
                <p><strong>Certificate Verification Code:</strong></p>
                <h2 style="color: #4F46E5; letter-spacing: 3px;">${verifyCode}</h2>
                <a href="${verifyUrl}" 
                   style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Download Certificate
                </a>
            </div>

            <p style="color: #999; font-size: 12px;">
                Verify this certificate at: ${verifyUrl}
            </p>
        </div>
        <div style="padding: 20px; text-align: center; color: #999;">
            <p>EventoraX — Event Management Platform</p>
        </div>
    </div>
    `
});

// Renewal / Expiry Warning Email
export const renewalTemplate = (name, orgName, expiryDate, renewUrl) => ({
    subject: `Action Required — Your ${orgName} Plan Expires Soon`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #EF4444; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">EventoraX</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
            <h2>⚠️ Plan Expiring Soon</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your <strong>${orgName}</strong> subscription plan expires on 
               <strong>${expiryDate}</strong>.</p>
            
            <div style="background: #FEF2F2; border: 1px solid #FCA5A5; padding: 20px; 
                        border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #DC2626;">
                    After expiry, you will lose access to premium features.
                    Renew now to avoid interruption.
                </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${renewUrl || '#'}" 
                   style="background-color: #EF4444; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px;">
                    Renew Now
                </a>
            </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #999;">
            <p>EventoraX — Event Management Platform</p>
        </div>
    </div>
    `
});
