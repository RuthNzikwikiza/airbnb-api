export function welcomeEmail(name: string, role: string): string {
  const roleMessage =
    role === "HOST"
      ? `<p>You're registered as a <strong>Host</strong>. Start by creating your first listing!</p>
         <a href="http://localhost:3000/listings" style="background:#FF5A5F;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
           Create a Listing
         </a>`
      : `<p>You're registered as a <strong>Guest</strong>. Start exploring amazing listings!</p>
         <a href="http://localhost:3000/listings" style="background:#FF5A5F;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
           Explore Listings
         </a>`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Welcome to Airbnb, ${name}!</h1>
      <p>Your account has been created successfully.</p>
      ${roleMessage}
      <p style="color:#999;font-size:12px;margin-top:24px;">
        If you didn't create this account, ignore this email.
      </p>
    </div>
  `;
}

export function bookingConfirmationEmail(
  guestName: string,
  listingTitle: string,
  location: string,
  checkIn: string,
  checkOut: string,
  totalPrice: number
): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Booking Confirmed</h1>
      <p>Hi ${guestName}, your booking has been confirmed.</p>
      <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0;">
        <h2 style="margin:0 0 8px;">${listingTitle}</h2>
        <p style="margin:4px 0;"> ${location}</p>
        <p style="margin:4px 0;"> Check-in: <strong>${checkIn}</strong></p>
        <p style="margin:4px 0;"> Check-out: <strong>${checkOut}</strong></p>
        <p style="margin:4px 0;"> Total Price: <strong>$${totalPrice}</strong></p>
      </div>
      <p style="color:#999;font-size:12px;">
        Cancellation policy: You can cancel your booking before check-in.
      </p>
    </div>
  `;
}

export function bookingCancellationEmail(
  guestName: string,
  listingTitle: string,
  checkIn: string,
  checkOut: string
): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Booking Cancelled</h1>
      <p>Hi ${guestName}, your booking has been cancelled.</p>
      <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0;">
        <h2 style="margin:0 0 8px;">${listingTitle}</h2>
        <p style="margin:4px 0;"> Check-in: <strong>${checkIn}</strong></p>
        <p style="margin:4px 0;"> Check-out: <strong>${checkOut}</strong></p>
      </div>
      <p>Looking for another place to stay?</p>
      <a href="http://localhost:3000/listings" style="background:#FF5A5F;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
        Find Another Listing
      </a>
    </div>
  `;
}

export function passwordResetEmail(name: string, resetLink: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Password Reset Request</h1>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <p>Click the button below this link expires in <strong>1 hour</strong>.</p>
      <a href="${resetLink}" style="background:#FF5A5F;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin:16px 0;">
        Reset Password
      </a>
      <p style="color:#999;font-size:12px;">
        If you did not request this ignore this email. Your password will not change.
      </p>
    </div>
  `;
}