# Images Directory

This directory is reserved for storing user-uploaded profile images.

## Current Implementation

Currently, images are stored in the browser's IndexedDB and localStorage for client-side storage. This directory structure is prepared for future backend integration.

## Storage Method

- **Primary Storage**: IndexedDB (for larger files)
- **Fallback Storage**: localStorage (for quick access)
- **User Data**: Images are also stored in the user object in the database

## Future Backend Integration

When implementing a backend server, images can be saved to this directory with the following structure:
- `public/images/avatars/{userId}.{ext}` - User profile pictures

## Image Specifications

- **Max File Size**: 5MB
- **Allowed Formats**: JPEG, JPG, PNG, GIF, WebP
- **Recommended Size**: 256x256px for optimal display

