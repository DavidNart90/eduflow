# PWA Icons Generation Guide

## Required Icon Sizes for EduFlow PWA

To complete the PWA setup, you need to generate the following icon sizes and place them in the `/public/icons/` directory:

### Standard Icons (purpose: "any")

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### Maskable Icons (purpose: "maskable")

- icon-192x192-maskable.png
- icon-512x512-maskable.png

### Shortcut Icons

- shortcut-dashboard.png (96x96)
- shortcut-fees.png (96x96)
- shortcut-reports.png (96x96)

## How to Generate Icons

### Option 1: Use PWA Icon Generator Tools

1. Visit https://www.pwabuilder.com/imageGenerator
2. Upload your base logo/icon (minimum 512x512 PNG)
3. Download the generated icon pack
4. Extract and place icons in `/public/icons/`

### Option 2: Use PWA Asset Generator

1. Visit https://progressier.com/pwa-icons-generator
2. Upload your logo
3. Generate all required sizes including maskable variants
4. Download and organize in the icons folder

### Option 3: Use RealFaviconGenerator

1. Visit https://realfavicongenerator.net/
2. Upload your master picture
3. Configure for PWA
4. Download and extract to `/public/icons/`

### Option 4: Manual Creation with Design Tools

- Use Figma, Sketch, or Canva
- Create a 1024x1024 master icon
- Export in all required sizes
- For maskable icons, ensure the important parts fit within the safe zone (80% of the icon)

## Design Guidelines

### Standard Icons

- Use your app's logo/brand
- Ensure readability at small sizes
- Use consistent colors with your app theme

### Maskable Icons

- Keep important content within the safe zone (center 80%)
- Fill the entire canvas with background color
- The system will apply the mask shape

## Screenshots for App Stores

Place these in `/public/screenshots/`:

- desktop-1.png (1280x720) - Desktop view of main dashboard
- mobile-1.png (390x844) - Mobile view of dashboard

Take screenshots showing key features of your EduFlow app.

## Current Status

❌ Icons need to be generated and placed in `/public/icons/`
❌ Screenshots need to be taken and placed in `/public/screenshots/`

Once you have generated the icons, the PWA manifest is already configured and ready to use them.
