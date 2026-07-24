# Personal Portfolio Website 🎮

A beautiful, modern personal portfolio website with a pastel gamer theme. Built with vanilla HTML, CSS, and JavaScript.

## 🎨 Features

- **Pastel Gamer Theme**: Beautiful pastel color scheme with gaming-inspired design elements
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations**: Engaging animations and transitions throughout
- **Interactive Elements**: Typing animation, skill bars, parallax effects, and more
- **Branding System**: Centralized color and theme configuration in `branding.json`
- **Modern UI/UX**: Clean, modern interface with excellent user experience

## 📁 Project Structure

```
personal-website/
├── index.html                    # Main HTML file
├── branding.json                 # Color and branding configuration
├── package.json                  # Project configuration
├── README.md                    # This file
├── css/                         # Stylesheets (component-based)
│   ├── base.css                # Base styles, variables, reset
│   ├── navigation.css          # Navigation bar styles
│   ├── hero.css                # Hero section styles
│   ├── about.css               # About section styles
│   ├── projects.css            # Projects section & demo modal styles
│   ├── skills.css              # Skills section styles
│   ├── contact.css             # Contact section styles
│   ├── footer.css              # Footer styles
│   └── responsive.css          # Responsive design media queries
└── src/
    └── scripts/                # JavaScript modules (organized by domain)
        ├── core/               # Core application logic
        │   └── main.js        # Main entry point
        ├── components/         # UI components
        │   ├── navigation.js  # Navigation functionality
        │   ├── animations.js  # Animation effects
        │   ├── scroll.js      # Scroll effects and parallax
        │   └── contactForm.js # Form handling
        └── projects/          # Project-related functionality
            ├── index.js       # Projects module entry
            ├── projectData.js # Project data structure
            ├── projectCard.js # Project card rendering
            └── projectDemo.js # Demo modal functionality
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js and npm (optional, for development server)

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser, or

### Running with a Development Server

For a better development experience with live reload:

```bash
# Using npm
npm install
npm run dev

# Or using npx directly
npx live-server --port=3000
```

The website will open automatically at `http://localhost:3000`

## 🎨 Customization

### Colors and Branding

All colors and branding elements are centralized in `branding.json`. Edit this file to change:

- Color palette (primary, secondary, accent, etc.)
- Font families
- Spacing values
- Border radius
- Shadows
- Animation settings

The CSS file uses CSS variables that correspond to the branding configuration, making it easy to maintain consistency.

### Content

Edit `index.html` to customize:

- **Hero Section**: Name, title, description, and stats
- **About Section**: Personal information and details
- **Skills**: Update your skills and proficiency levels
- **Contact**: Update contact information and social links

### Projects

Projects are managed dynamically through `src/scripts/projects/projectData.js`. Simply add or edit project objects in the `projects` array. Projects with demos will automatically get a demo button that opens a modal.

**Project Demo Types:**
- `iframe` - Embed a demo via iframe (e.g., deployed app)
- `code` - Code-based demo (e.g., CodePen, CodeSandbox)
- `embedded` - Embedded interactive demo

The project cards are automatically rendered from the data, so you don't need to edit HTML for each project.

### Styling

Styles are organized into component-based files in the `css/` directory:
- `base.css` - CSS variables, reset, and base styles
- Component-specific files for each section
- `responsive.css` - All media queries for responsive design

This modular structure makes it easy to find and modify specific components.

## 📱 Sections

1. **Hero**: Eye-catching introduction with typing animation
2. **About**: Personal information and background
3. **Projects**: Showcase of featured projects
4. **Skills**: Technical skills with animated progress bars
5. **Contact**: Contact form and social links

## 🛠️ Technologies Used

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript (ES6 Modules)
- Google Fonts (Orbitron, Inter, Fira Code)

## 🏗️ Code Structure

The codebase follows a modular, component-based structure with meaningful folder organization:

### CSS Structure
- Split into component files for better maintainability
- Each section has its own stylesheet
- Responsive styles are centralized in `responsive.css`

### JavaScript Structure
Organized by domain and functionality:

- **`src/scripts/core/`** - Core application logic
  - `main.js` - Entry point that initializes all modules

- **`src/scripts/components/`** - UI components
  - `navigation.js` - Navigation menu, smooth scrolling, active states
  - `animations.js` - Typing animation, skill bars, stat counters
  - `scroll.js` - Parallax effects and scroll-based animations
  - `contactForm.js` - Contact form handling and validation

- **`src/scripts/projects/`** - Project management system
  - `index.js` - Projects module entry point
  - `projectData.js` - Centralized project data structure
  - `projectCard.js` - Dynamic project card rendering
  - `projectDemo.js` - Demo modal system for projects with demos

### Adding Projects

Projects are managed in `src/scripts/projects/projectData.js`. To add a new project:

```javascript
{
    id: 'unique-id',
    title: 'Project Title',
    description: 'Project description',
    icon: '🎮', // Emoji or icon
    tags: ['React', 'Node.js'],
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com/user/repo',
    hasDemo: true, // Set to true if project has a demo
    demoUrl: 'https://demo.example.com',
    demoType: 'iframe' // 'iframe', 'code', or 'embedded'
}
```

Projects with `hasDemo: true` will automatically get a demo button that opens a modal with the demo.

## 📝 Notes

- Replace placeholder content with your actual information
- Update social media links in the contact section
- Add your own project images and links
- Customize the color scheme in `branding.json` to match your preferences
- The contact form currently shows an alert - integrate with a backend service for actual form submission

## 🎮 Gamer Theme Elements

- Pixel grid background animation
- Gaming-inspired badges and labels
- Level/XP references
- Smooth, game-like animations
- Pastel color palette perfect for a modern gamer aesthetic

## 📄 License

MIT License - feel free to use this template for your own portfolio!

## 🤝 Contributing

Feel free to fork this project and customize it for your own use. If you make improvements, pull requests are welcome!

---

Built with ❤️ and lots of ☕ 
