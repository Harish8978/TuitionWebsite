# GPS-Verified QR Attendance Walkthrough

The GPS attendance feature has been successfully implemented using your actual tuition center coordinates! Here’s a summary of the work that was completed and how you can test it.

---

## What Was Completed

1. **Tuition Coordinates Configured**: Added `13.129053, 80.078009` as the tuition center location in `src/config/tuitionLocation.ts`. The default acceptable radius is 100 meters.
2. **GPS Verification Utility**: Created `src/utils/gpsVerification.ts` to calculate the real-time distance using the browser’s built-in Geolocation API (Haversine formula).
3. **Staff Dashboard Updates**: Modified the "Mark Present Today" button to automatically check the staff member's GPS location. 
   - Denies check-in with a visual warning if they are too far from the center.
   - Denies check-in if GPS permissions are rejected.
4. **Admin QR Code Generator**: Modified the Staff Management admin page. We added `qrcode.react` to dynamically generate a printable QR code linked to the tuition website. 
5. **Local Network Access**: Enabled the `host: true` configuration in Vite, allowing staff phones to connect to your dev server directly over the same Wi-Fi connection.

---

## Testing During Development

Since the site isn't deployed yet, you can test it seamlessly using your local network properties.

1. **Connect both devices to the same Wi-Fi** (your PC and your phone must be on the **same router**).
2. **Start the Dev Server**: Run `npm run dev` in your terminal. Note the `Network` IP shown in the terminal (e.g., `http://192.168.1.100:5173`).
3. **Generate the QR Code**: 
   - Open your admin panel → `Manage Staff`.
   - Scroll down to the **Attendance QR** card.
   - Make sure the URL input matches the `Network` URL from your terminal with `/staff` appended (e.g., `http://192.168.1.100:5173/staff`).
   - Click "View Full Size / Print".
4. **Scan from Phone**:
   - Open your phone's camera, point it at the QR code on your PC screen, and tap the link that appears.
   - Log in as a staff member.
5. **Mark Attendance**:
   - Navigate to the **Daily Attendance** section.
   - Tap **"Mark Present Today"**.
   - Your phone will prompt you "Allow this site to access your location" → tap Allow.
   - The system will check the distance. Since you might not be currently at the tuition center coordinates (`13.129053, 80.078009`), it should correctly reject you and say "You are out of the radius". 

> [!TIP]
> **Modifying the Testing Radius**: If you want to temporarily verify a successful save while you are at home, you can go into `src/config/tuitionLocation.ts` and set your actual home coordinates, or increase the `radiusMeters` temporarily to an extremely large value. Remember to revert it afterwards!

---

## Production Handover

When you deploy the application:
The only required action is for the Admin to update the **Check-in URL** text field on the `Manage Staff` page. The field should be changed from the Local IP to the real domain name (e.g., `https://my-tuition-site.com/staff`), and then the final QR Code can be printed and taped to the tuition entrance. 
