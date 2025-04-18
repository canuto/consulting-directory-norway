# directory-template

Create SEO optimized directory services using Codehooks.io as a backend

## Installation

1. Clone the repository:

```bash
git clone https://github.com/RestDB/directory-template
cd directory-template
```

2. Install dependencies:

```bash
npm install
```

3. Connect local project to your Codehooks.io project:

```bash
coho init --empty
```

## Setup with Mock Data

```bash
npm run mock
```

This command initializes your directory service with sample data from `bin/listings.json`. The mock data includes:

- Furniture listings with detailed product information
- Categories like Living Room, Office, Bedroom, and Dining Room
- SEO-optimized content with keywords and descriptions
- Rich metadata including images, features, and specifications
- Hierarchical organization with categories and directories

Each listing contains:

- Title and SEO-friendly slug
- Category and directory classification
- Detailed product specifications
- Featured status indicators
- High-quality product descriptions
- Image URLs and website links

The mock data creates a fully functional directory service, perfect for testing and development before adding your own content.

## Deployment

1. Deploy the backend to Codehooks.io:

```bash
npm run deploy
```

This command deploys both the backend service and the client application. After deployment:

1. Your service will be available at your project's auto-generated domain:

   ```
   https://your-project-name.codehooks.io
   ```

   (e.g., `https://rapid-fox-f20c.codehooks.io`)

2. The deployment includes:
   - Backend API endpoints for managing listings
   - Frontend client application with complete UI
   - Sample data (if you ran the mock setup)
   - SEO-optimized pages for all listings

Visit your project's domain to see the live directory service in action.

## Create automatic screenshots

There's a utility tool that let's you create a screenshot for each url in the database.

Run this command to create a local folder `~/tmp/screenshots` of screenshots:

```
npm run screenshot
```

This may take a while - grab a coffee or tea ☕️.

After the local screenshots have been created, you may upload all to the Codehooks blob storage with this command:

```
npm run uploadscreenshots
```

This may also take some time - refill your cup ☕️.

## UI Customization

This project uses [DaisyUI](https://daisyui.com/) and [Tailwind CSS](https://tailwindcss.com/) for styling.

### DaisyUI Theme Customization

The theme configuration is managed in `web/css/input.css` using DaisyUI's plugin syntax:

```css
@plugin "daisyui" {
  themes: light --default, dark, night;
}
```

This configuration:

- Sets `light` as the default theme
- Includes `dark` and `night` themes as alternatives
- Users can switch between these themes using DaisyUI's theme change utilities

To modify available themes:

1. Edit the themes list in `web/css/input.css`
2. Choose from [DaisyUI's built-in themes](https://daisyui.com/docs/themes/)
3. You can also add custom themes following DaisyUI's theming guidelines

### Tailwind CSS Customization

1. Extend or modify Tailwind's default configuration in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        128: '32rem',
      },
      colors: {
        'custom-blue': '#1234567',
      },
      // Add more customizations
    },
  },
};
```

2. Use custom classes in your components:

```jsx
<div className="text-custom-blue p-128">Custom styled content</div>
```

## Learn More

- [Codehooks.io Documentation](https://codehooks.io/docs)
- [DaisyUI Documentation](https://daisyui.com/docs/install/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
