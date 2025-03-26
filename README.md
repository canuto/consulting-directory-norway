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

3. Connect local project to your Codehooks.ui project:
```bash
coho init --empty
```

## Setup with Mock Data

1. Initialize Codehooks.io backend:
```bash
npx codehooks init
```

2. Create sample data using the provided seed script:
```bash
npm run seed
# or
yarn seed
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Deployment

1. Deploy the backend to Codehooks.io:
```bash
npx codehooks deploy
```

2. Deploy the frontend to Vercel:
```bash
npm run build
vercel deploy
```

Or connect your GitHub repository to Vercel for automatic deployments.

## UI Customization

This project uses [DaisyUI](https://daisyui.com/) and [Tailwind CSS](https://tailwindcss.com/) for styling.

### DaisyUI Theme Customization

1. Modify the theme in `tailwind.config.js`:
```javascript
module.exports = {
  //...
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": "#570DF8",
          "secondary": "#F000B8",
          "accent": "#37CDBE",
          "neutral": "#3D4451",
          "base-100": "#FFFFFF",
          // Add more color customizations
        },
      },
    ],
  },
}
```

2. Apply themes using the `data-theme` attribute:
```html
<html data-theme="mytheme">
```

### Tailwind CSS Customization

1. Extend or modify Tailwind's default configuration in `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        '128': '32rem',
      },
      colors: {
        'custom-blue': '#1234567',
      },
      // Add more customizations
    },
  },
}
```

2. Use custom classes in your components:
```jsx
<div className="text-custom-blue p-128">
  Custom styled content
</div>
```

## Learn More

- [Codehooks.io Documentation](https://codehooks.io/docs)
- [DaisyUI Documentation](https://daisyui.com/docs/install/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)


